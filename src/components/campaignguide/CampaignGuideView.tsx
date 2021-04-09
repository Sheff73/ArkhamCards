import React, { useCallback, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Navigation } from 'react-native-navigation';
import { useDispatch } from 'react-redux';
import { t } from 'ttag';

import { updateCampaignName } from '@components/campaign/actions';
import withCampaignGuideContext, { CampaignGuideInputProps, InjectedCampaignGuideContextProps } from '@components/campaignguide/withCampaignGuideContext';
import { NavigationProps } from '@components/nav/types';
import { useNavigationButtonPressed } from '@components/core/hooks';
import CampaignGuideContext from './CampaignGuideContext';
import { useStopAudioOnUnmount } from '@lib/audio/narrationPlayer';
import { useAlertDialog, useCountDialog, useSimpleTextDialog } from '@components/deck/dialogs';
import CampaignDetailTab from './CampaignDetailTab';
import UploadCampaignButton from '@components/campaign/UploadCampaignButton';
import DeleteCampaignButton from '@components/campaign/DeleteCampaignButton';
import space from '@styles/space';
import { useUpdateCampaignActions } from '@data/remote/campaigns';

export type CampaignGuideProps = CampaignGuideInputProps;

type Props = CampaignGuideProps & NavigationProps & InjectedCampaignGuideContextProps;

function CampaignGuideView(props: Props) {
  const [countDialog, showCountDialog] = useCountDialog();
  const { componentId, setCampaignServerId } = props;
  const campaignData = useContext(CampaignGuideContext);
  const { campaignId } = campaignData;
  const dispatch = useDispatch();
  const updateCampaignActions = useUpdateCampaignActions();
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
    value: campaignData.campaignName,
    onValueChange: setCampaignName,
  });

  useStopAudioOnUnmount();
  useNavigationButtonPressed(({ buttonId }) => {
    if (buttonId === 'edit') {
      showEditNameDialog();
    }
  }, componentId, [showEditNameDialog]);

  const { campaignGuide, campaignState, campaignName } = campaignData;
  const processedCampaign = useMemo(() => campaignGuide.processAllScenarios(campaignState), [campaignGuide, campaignState]);
  const [alertDialog, showAlert] = useAlertDialog();
  const footerButtons = useMemo(() => {
    return (
      <View style={space.paddingSideS}>
        <UploadCampaignButton
          campaignId={campaignId}
          setCampaignServerId={setCampaignServerId}
          showAlert={showAlert}
          guided
        />
        <DeleteCampaignButton
          componentId={componentId}
          campaignId={campaignId}
          campaignName={campaignName || ''}
          showAlert={showAlert}
        />
      </View>
    );
  }, [componentId, campaignName, campaignId, setCampaignServerId, showAlert]);
  return (
    <View style={styles.wrapper}>
      <CampaignDetailTab
        componentId={componentId}
        processedCampaign={processedCampaign}
        showAlert={showAlert}
        showCountDialog={showCountDialog}
        footerButtons={footerButtons}
        updateCampaignActions={updateCampaignActions}
      />
      { alertDialog }
      { dialog }
      { countDialog }
    </View>
  );
}

export default withCampaignGuideContext(CampaignGuideView, { rootView: true });

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});
