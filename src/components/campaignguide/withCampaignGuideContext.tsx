import React from 'react';
import { Platform, Text, View } from 'react-native';
import { flatMap, forEach, map } from 'lodash';
import { Navigation, OptionsModalPresentationStyle } from 'react-native-navigation';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch, Action } from 'redux';
import hoistNonReactStatic from 'hoist-non-react-statics';

import { MyDecksSelectorProps } from 'components/campaign/MyDecksSelectorDialog';
import CampaignGuideContext, { CampaignGuideContextType } from './CampaignGuideContext';
import {
  addInvestigator,
  deleteCampaign,
} from 'components/campaign/actions';
import {
  startScenario,
  resetScenario,
  setScenarioCount,
  setScenarioDecision,
  setScenarioChoice,
  setScenarioSupplies,
  setScenarioNumberChoices,
  setScenarioStringChoices,
  setScenarioText,
  undo,
} from './actions';
import { Deck, InvestigatorData, NumberChoices, StringChoices, SupplyCounts, SingleCampaign, CampaignGuideState } from 'actions/types';
import CampaignStateHelper from 'data/scenario/CampaignStateHelper';
import { getCampaignGuide } from 'data/scenario';
import Card from 'data/Card';
import withPlayerCards, { PlayerCardProps } from 'components/core/withPlayerCards';
import {
  AppState,
  getCampaign,
  getCampaignGuideState,
  getLatestCampaignInvestigators,
  getAllDecks,
  getLatestCampaignDeckIds,
} from 'reducers';

export interface CampaignGuideInputProps {
  campaignId: number;
}

interface ReduxProps {
  campaign?: SingleCampaign;
  campaignState: CampaignGuideState;
  campaignInvestigators: Card[];
  latestDecks: Deck[];
}

interface ReduxActionProps {
  deleteCampaign: (campaignId: number) => void;
  addInvestigator: (campaignId: number, investigator: string, deckId?: number) => void;
  startScenario: (campaignId: number, scenarioId: string) => void;
  setScenarioDecision: (
    campaignId: number,
    stepId: string,
    value: boolean,
    scenarioId?: string
  ) => void;
  setScenarioCount: (
    campaignId: number,
    stepId: string,
    value: number,
    scenarioId?: string
  ) => void;
  setScenarioSupplies: (
    campaignId: number,
    stepId: string,
    supplyCounts: SupplyCounts,
    scenarioId?: string
  ) => void;
  setScenarioStringChoices: (
    campaignId: number,
    stepId: string,
    choices: StringChoices,
    scenarioId?: string
  ) => void;
  setScenarioNumberChoices: (
    campaignId: number,
    stepId: string,
    supplyCounts: NumberChoices,
    scenarioId?: string
  ) => void;
  setScenarioChoice: (
    campaignId: number,
    stepId: string,
    choice: number,
    scenarioId?: string
  ) => void;
  setScenarioText: (
    campaignId: number,
    stepId: string,
    text: string,
    scenarioId?: string
  ) => void;
  resetScenario: (
    campaignId: number,
    scenarioId: string
  ) => void;
  undo: (
    campaignId: number,
    scenarioId: string
  ) => void;
}

const EMPTY_INVESTIGATOR_DATA: InvestigatorData = {};

export default function withCampaignGuideContext<Props>(
  WrappedComponent: React.ComponentType<Props & CampaignGuideContextType>
): React.ComponentType<Props & CampaignGuideInputProps> {
  const mapStateToProps = (
    state: AppState,
    props: Props & CampaignGuideInputProps & PlayerCardProps
  ): ReduxProps => {
    const campaign = getCampaign(state, props.campaignId);
    const campaignInvestigators = getLatestCampaignInvestigators(state, props.investigators, campaign);
    const decks = getAllDecks(state);
    const latestDeckIds = getLatestCampaignDeckIds(state, campaign);

    return {
      campaign,
      campaignState: getCampaignGuideState(state, props.campaignId),
      latestDecks: flatMap(latestDeckIds, deckId => decks[deckId]),
      campaignInvestigators,
    };
  };

  const mapDispatchToProps = (
    dispatch: Dispatch<Action>
  ): ReduxActionProps => {
    return bindActionCreators({
      addInvestigator,
      deleteCampaign,
      startScenario,
      setScenarioCount,
      setScenarioDecision,
      setScenarioSupplies,
      setScenarioNumberChoices,
      setScenarioStringChoices,
      resetScenario,
      setScenarioChoice,
      setScenarioText,
      undo,
    }, dispatch);
  };
  class CampaignDataComponent extends React.Component<
    Props &
    CampaignGuideInputProps &
    PlayerCardProps &
    ReduxProps &
    ReduxActionProps
  > {
    _showChooseDeck = (
      singleInvestigator?: Card,
      callback?: (code: string) => void
    ) => {
      const {
        campaignId,
        campaignInvestigators,
      } = this.props;
      const onDeckSelect = (deck: Deck) => {
        this._addInvestigator(deck.investigator_code, deck.id);
        callback && callback(deck.investigator_code);
      };
      const passProps: MyDecksSelectorProps = singleInvestigator ? {
        campaignId: campaignId,
        singleInvestigator: singleInvestigator.code,
        onDeckSelect,
      } : {
        campaignId: campaignId,
        selectedInvestigatorIds: map(campaignInvestigators, investigator => investigator.code),
        onDeckSelect,
        onInvestigatorSelect: (card: Card) => {
          this._addInvestigator(card.code);
          callback && callback(card.code);
        },
        simpleOptions: true,
      };
      Navigation.showModal({
        stack: {
          children: [{
            component: {
              name: 'Dialog.DeckSelector',
              passProps,
              options: {
                modalPresentationStyle: Platform.OS === 'ios' ?
                  OptionsModalPresentationStyle.overFullScreen :
                  OptionsModalPresentationStyle.overCurrentContext,
              },
            },
          }],
        },
      });
    };

    _addInvestigator = (
      code: string,
      deckId?: number
    ) => {
      const {
        addInvestigator,
        campaignId,
      } = this.props;
      addInvestigator(campaignId, code, deckId);
    };

    _startScenario = (
      scenarioId: string
    ) => {
      const {
        startScenario,
        campaignId,
      } = this.props;
      startScenario(campaignId, scenarioId);
    };

    _setScenarioDecision = (
      stepId: string,
      value: boolean,
      scenarioId?: string
    ) => {
      const {
        setScenarioDecision,
        campaignId,
      } = this.props;
      setScenarioDecision(
        campaignId,
        stepId,
        value,
        scenarioId
      );
    };

    _setScenarioCount = (
      stepId: string,
      value: number,
      scenarioId?: string
    ) => {
      const {
        setScenarioCount,
        campaignId,
      } = this.props;
      setScenarioCount(
        campaignId,
        stepId,
        value,
        scenarioId
      );
    };

    _setScenarioText = (
      stepId: string,
      value: string,
      scenarioId?: string
    ) => {
      const {
        setScenarioText,
        campaignId,
      } = this.props;
      setScenarioText(
        campaignId,
        stepId,
        value,
        scenarioId
      );
    };


    _setSupplies = (
      stepId: string,
      supplyCounts: SupplyCounts,
      scenarioId?: string
    ) => {
      const {
        setScenarioSupplies,
        campaignId,
      } = this.props;
      setScenarioSupplies(
        campaignId,
        stepId,
        supplyCounts,
        scenarioId
      );
    };

    _setStringChoices = (
      stepId: string,
      choices: StringChoices,
      scenarioId?: string
    ) => {
      const {
        setScenarioStringChoices,
        campaignId,
      } = this.props;
      setScenarioStringChoices(
        campaignId,
        stepId,
        choices,
        scenarioId
      );
    };

    _setNumberChoices = (
      stepId: string,
      choices: NumberChoices,
      scenarioId?: string
    ) => {
      const {
        setScenarioNumberChoices,
        campaignId,
      } = this.props;
      setScenarioNumberChoices(
        campaignId,
        stepId,
        choices,
        scenarioId
      );
    };

    _setChoice = (
      stepId: string,
      choice: number,
      scenarioId?: string
    ) => {
      const {
        setScenarioChoice,
        campaignId,
      } = this.props;
      setScenarioChoice(
        campaignId,
        stepId,
        choice,
        scenarioId
      );
    };

    _undo = (scenarioId: string) => {
      const {
        undo,
        campaignId,
      } = this.props;
      undo(campaignId, scenarioId);
    };

    _resetScenario = (scenarioId: string) => {
      const {
        resetScenario,
        campaignId,
      } = this.props;
      resetScenario(campaignId, scenarioId);
    }

    render() {
      const {
        campaign,
        campaignState,
        campaignInvestigators,
        investigators,
        latestDecks,
        cards,
      } = this.props;
      if (!campaign) {
        return (
          <Text>Unknown Campaign</Text>
        );
      }
      const decksByInvestigator: {
        [code: string]: Deck | undefined;
      } = {};
      forEach(latestDecks, deck => {
        if (deck && deck.investigator_code) {
          decksByInvestigator[deck.investigator_code] = deck;
        }
      });
      const campaignStateHelper = new CampaignStateHelper(
        campaignState,
        investigators,
        {
          showChooseDeck: this._showChooseDeck,
          startScenario: this._startScenario,
          setCount: this._setScenarioCount,
          setDecision: this._setScenarioDecision,
          setSupplies: this._setSupplies,
          setNumberChoices: this._setNumberChoices,
          setStringChoices: this._setStringChoices,
          setChoice: this._setChoice,
          setText: this._setScenarioText,
          resetScenario: this._resetScenario,
          undo: this._undo,
        }
      );
      const campaignGuide = getCampaignGuide(campaign.cycleCode);
      if (!campaignGuide) {
        return (
          <View>
            <Text>Unknown Campaign Guide</Text>
          </View>
        );
      }
      const context: CampaignGuideContextType = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        campaignGuide,
        campaignState: campaignStateHelper,
        campaignInvestigators,
        latestDecks: decksByInvestigator,
        weaknessSet: campaign.weaknessSet,
        adjustedInvestigatorData: campaign.adjustedInvestigatorData || EMPTY_INVESTIGATOR_DATA,
        playerCards: cards,
      };
      return (
        <CampaignGuideContext.Provider value={context}>
          <WrappedComponent
            {...this.props as Props}
            campaignId={campaign.id}
            campaignName={campaign.name}
            weaknessSet={campaign.weaknessSet}
            campaignGuide={campaignGuide}
            playerCards={cards}
            campaignState={campaignStateHelper}
            campaignInvestigators={campaignInvestigators}
            latestDecks={decksByInvestigator}
            adjustedInvestigatorData={campaign.adjustedInvestigatorData || EMPTY_INVESTIGATOR_DATA}
          />
        </CampaignGuideContext.Provider>
      );
    }
  }
  const result = withPlayerCards<Props & CampaignGuideContextType & CampaignGuideInputProps>(
    connect<ReduxProps, ReduxActionProps, Props & PlayerCardProps & CampaignGuideInputProps & PlayerCardProps, AppState>(
      mapStateToProps,
      mapDispatchToProps
    )(
      // @ts-ignore TS2345
      CampaignDataComponent
    )
  );
  hoistNonReactStatic(result, WrappedComponent);
  return result as React.ComponentType<Props & CampaignGuideInputProps>;
}