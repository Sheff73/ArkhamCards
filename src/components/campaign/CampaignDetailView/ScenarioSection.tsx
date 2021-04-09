import React, { useContext } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { t } from 'ttag';

import BasicButton from '@components/core/BasicButton';
import CampaignSummaryComponent from '../CampaignSummaryComponent';
import NavButton from '@components/core/NavButton';
import space from '@styles/space';
import StyleContext from '@styles/StyleContext';
import SingleCampaignT from '@data/interfaces/SingleCampaignT';

interface Props {
  campaign: SingleCampaignT;
  viewScenarios: () => void;
  addScenarioResult: () => void;
}

export default function ScenarioSection({ campaign, viewScenarios, addScenarioResult }: Props) {
  const { borderStyle } = useContext(StyleContext);
  return (
    <>
      <NavButton onPress={viewScenarios} noBorder>
        <View style={[
          styles.section,
          space.paddingBottomS,
          space.paddingSideS,
          space.marginTopS,
          space.marginBottomS]}>
          <CampaignSummaryComponent campaign={campaign} />
        </View>
      </NavButton>
      <View style={[styles.bottomBorder, borderStyle]}>
        <BasicButton
          title={t`Record Scenario Results`}
          onPress={addScenarioResult}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  bottomBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
