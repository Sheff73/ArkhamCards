import React, { useCallback, useContext, useMemo, useRef, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Navigation } from 'react-native-navigation';
import { useDispatch } from 'react-redux';
import { t } from 'ttag';

import { CampaignId } from '@actions/types';
import CampaignGuideContext from '@components/campaignguide/CampaignGuideContext';
import useTabView from '@components/core/useTabView';
import { updateCampaignName } from '@components/campaign/actions';
import { useLiveCampaignGuideReduxData } from '@components/campaignguide/contextHelper';
import { NavigationProps } from '@components/nav/types';
import { useLiveCampaign } from '@data/hooks';
import { useInvestigatorCards, useNavigationButtonPressed } from '@components/core/hooks';
import useCampaignGuideContext from '@components/campaignguide/useCampaignGuideContext';
import { useStopAudioOnUnmount } from '@lib/audio/narrationPlayer';
import { useAlertDialog, useCountDialog, useSimpleTextDialog } from '@components/deck/dialogs';
import { useCampaignId } from '@components/campaign/hooks';
import { useCampaignLinkHelper } from './useCampaignLinkHelper';
import CampaignDetailTab from '../CampaignDetailTab';
import UploadCampaignButton from '@components/campaign/UploadCampaignButton';
import DeleteCampaignButton from '@components/campaign/DeleteCampaignButton';
import space from '@styles/space';
import { useUpdateCampaignActions } from '@data/remote/campaigns';
import { useCreateDeckActions } from '@data/remote/decks';

export interface LinkedCampaignGuideProps {
  campaignId: CampaignId;
  campaignIdA: CampaignId;
  campaignIdB: CampaignId;
}

type Props = LinkedCampaignGuideProps & NavigationProps;

export default function LinkedCampaignGuideView(props: Props) {
  const { componentId } = props;
  const [countDialog, showCountDialog] = useCountDialog();
  const [campaignId, setCampaignServerId] = useCampaignId(props.campaignId);
  const [campaignIdA, campaignIdB] = useMemo(() => {
    return [
      { campaignId: props.campaignIdA.campaignId, serverId: campaignId.serverId },
      { campaignId: props.campaignIdB.campaignId, serverId: campaignId.serverId },
    ];
  }, [props.campaignIdA, props.campaignIdB, campaignId.serverId]);
  const investigators = useInvestigatorCards();
  const dispatch = useDispatch();
  const createDeckActions = useCreateDeckActions();
  const updateCampaignActions = useUpdateCampaignActions();
  useStopAudioOnUnmount();

  const [campaign] = useLiveCampaign(campaignId, investigators);
  const campaignName = campaign?.name || '';
  const campaignDataA = useLiveCampaignGuideReduxData(campaignIdA, investigators);
  const campaignDataB = useLiveCampaignGuideReduxData(campaignIdB, investigators);

  const setCampaignName = useCallback((name: string) => {
    dispatch(updateCampaignName(updateCampaignActions, campaignId, name));
    Navigation.mergeOptions(componentId, {
      topBar: {
        title: {
          text: name,
        },
      },
    });
  }, [campaignId, dispatch, updateCampaignActions, componentId]);

  const { dialog, showDialog: showEditNameDialog } = useSimpleTextDialog({
    title: t`Name`,
    value: campaignName,
    onValueChange: setCampaignName,
  });

  useNavigationButtonPressed(({ buttonId }) => {
    if (buttonId === 'edit') {
      showEditNameDialog();
    }
  }, componentId, [showEditNameDialog]);

  const contextA = useCampaignGuideContext(campaignIdA, createDeckActions, updateCampaignActions, campaignDataA);
  const contextB = useCampaignGuideContext(campaignIdB, createDeckActions, updateCampaignActions, campaignDataB);
  const processedCampaignA = useMemo(() => contextA?.campaignGuide && contextA?.campaignState && contextA.campaignGuide.processAllScenarios(contextA.campaignState), [contextA?.campaignGuide, contextA?.campaignState]);
  const processedCampaignB = useMemo(() => contextB?.campaignGuide && contextB?.campaignState && contextB.campaignGuide.processAllScenarios(contextB.campaignState), [contextB?.campaignGuide, contextB?.campaignState]);

  const setSelectedTabRef = useRef<((index: number) => void) | undefined>(undefined);
  const [showCampaignScenarioA, showCampaignScenarioB, displayLinkScenarioCount] = useCampaignLinkHelper({
    componentId,
    campaignA: processedCampaignA,
    campaignDataA: contextA,
    campaignB: processedCampaignB,
    campaignDataB: contextB,
    setSelectedTab: setSelectedTabRef.current,
  });
  const [alertDialog, showAlert] = useAlertDialog();
  const footerButtons = useMemo(() => {
    return (
      <View style={space.paddingSideS}>
        <UploadCampaignButton
          campaignId={campaignId}
          setCampaignServerId={setCampaignServerId}
          showAlert={showAlert}
          guided
          linked={campaign?.linked}
        />
        <DeleteCampaignButton
          componentId={componentId}
          campaignId={campaignId}
          campaignName={campaignName || ''}
          showAlert={showAlert}
        />
      </View>
    );
  }, [showAlert, setCampaignServerId, componentId, campaignId, campaignName, campaign?.linked]);

  const campaignATab = useMemo(() => {
    if (!campaignDataA || !processedCampaignA || !contextA) {
      return null;
    }
    return {
      key: 'campaignA',
      title: contextA.campaignGuide.campaignName(),
      node: (
        <SafeAreaView style={styles.wrapper}>
          <CampaignGuideContext.Provider value={contextA}>
            <CampaignDetailTab
              componentId={componentId}
              processedCampaign={processedCampaignA}
              showLinkedScenario={showCampaignScenarioB}
              showAlert={showAlert}
              showCountDialog={showCountDialog}
              displayLinkScenarioCount={displayLinkScenarioCount}
              footerButtons={footerButtons}
              updateCampaignActions={updateCampaignActions}
            />
          </CampaignGuideContext.Provider>
        </SafeAreaView>
      ),
    };
  }, [campaignDataA, processedCampaignA, contextA, componentId, displayLinkScenarioCount, footerButtons,
    updateCampaignActions, showCampaignScenarioB, showCountDialog, showAlert]);
  const campaignBTab = useMemo(() => {
    if (!campaignDataB || !processedCampaignB || !contextB) {
      return null;
    }
    return {
      key: 'campaignB',
      title: contextB.campaignGuide.campaignName(),
      node: (
        <SafeAreaView style={styles.wrapper}>
          <CampaignGuideContext.Provider value={contextB}>
            <CampaignDetailTab
              componentId={componentId}
              processedCampaign={processedCampaignB}
              showLinkedScenario={showCampaignScenarioA}
              showAlert={showAlert}
              showCountDialog={showCountDialog}
              displayLinkScenarioCount={displayLinkScenarioCount}
              footerButtons={footerButtons}
              updateCampaignActions={updateCampaignActions}
            />
          </CampaignGuideContext.Provider>
        </SafeAreaView>
      ),
    };
  }, [campaignDataB, processedCampaignB, contextB, componentId, displayLinkScenarioCount, footerButtons,
    updateCampaignActions, showCampaignScenarioA, showCountDialog, showAlert]);
  const tabs = useMemo(() => {
    if (!campaignATab || !campaignBTab) {
      return [];
    }
    return [campaignATab, campaignBTab];
  }, [campaignATab, campaignBTab]);
  const [tabView, setSelectedTab] = useTabView({ tabs });
  useEffect(() => {
    setSelectedTabRef.current = setSelectedTab;
  }, [setSelectedTab]);
  return (
    <View style={styles.wrapper}>
      { tabView }
      { alertDialog }
      { dialog }
      { countDialog }
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});
