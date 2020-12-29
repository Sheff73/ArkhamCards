import React, { useCallback, useContext, useMemo } from 'react';
import { AppState, Button } from 'react-native';
import { flatMap, find, forEach, map, sortBy } from 'lodash';
import { t } from 'ttag';
import { Action } from 'redux';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';

import { Deck, Slots, NumberChoices } from '@actions/types';
import { BODY_OF_A_YITHIAN } from '@app_constants';
import BasicButton from '@components/core/BasicButton';
import CardSectionHeader from '@components/core/CardSectionHeader';
import CardSearchResult from '@components/cardlist/CardSearchResult';
import { showDeckModal, showCard } from '@components/nav/helper';
import InvestigatorRow from '@components/core/InvestigatorRow';
import { useDeck } from '@components/core/hooks';
import useCardList from '@components/card/useCardList';
import { saveDeckChanges, DeckChanges } from '@components/deck/actions';
import Card from '@data/Card';
import CampaignStateHelper from '@data/scenario/CampaignStateHelper';
import ScenarioStateHelper from '@data/scenario/ScenarioStateHelper';
import GuidedCampaignLog from '@data/scenario/GuidedCampaignLog';
import StyleContext from '@styles/StyleContext';

interface ShowDeckButtonProps {
  componentId: string;
  deckId: number;
  investigator: Card;
}

function ShowDeckButton({ componentId, deckId, investigator }: ShowDeckButtonProps) {
  const { colors } = useContext(StyleContext);
  const [deck] = useDeck(deckId, {});
  const onPress = useCallback(() => {
    if (deck) {
      showDeckModal(
        componentId,
        deck,
        colors,
        investigator,
        { hideCampaign: true }
      );
    }
  }, [componentId, investigator, deck, colors]);

  if (!deck) {
    return null;
  }
  return (
    <Button
      title={t`View deck`}
      onPress={onPress}
    />
  );
}

interface Props {
  componentId: string;
  id: string;
  campaignState: CampaignStateHelper;
  scenarioState: ScenarioStateHelper;
  investigator: Card;
  deck?: Deck;
  campaignLog: GuidedCampaignLog;
  editable: boolean;
}
type DeckDispatch = ThunkDispatch<AppState, any, Action<unknown>>;

function computeChoiceId(stepId: string, investigator: Card) {
  return `${stepId}#${investigator.code}`;
}

function SaveDeckRow({ componentId, id, campaignState, scenarioState, investigator, deck, campaignLog, editable }: Props) {
  const { colors } = useContext(StyleContext);
  const deckDispatch: DeckDispatch = useDispatch();
  const choiceId = useMemo(() => {
    return computeChoiceId(id, investigator);
  }, [id, investigator]);

  const saveCampaignLog = useCallback((deck?: Deck) => {
    const choices: NumberChoices = {};
    if (deck) {
      choices.deckId = [deck.id];
    }
    scenarioState.setNumberChoices(choiceId, choices);
  }, [scenarioState, choiceId]);

  const choices = useMemo(() => scenarioState.numberChoices(choiceId), [scenarioState, choiceId]);
  const storyAssetDeltas = useMemo(() => campaignLog.storyAssetChanges(investigator.code), [campaignLog, investigator]);

  const save = useCallback(() => {
    if (deck) {
      const slots: Slots = { ...deck.slots };
      forEach(storyAssetDeltas, (delta, code) => {
        slots[code] = (slots[code] || 0) + delta;
        if (!slots[code]) {
          delete slots[code];
        }
      });
      const changes: DeckChanges = { slots };
      deckDispatch(saveDeckChanges(deck, changes) as any).then(saveCampaignLog);
    }
  }, [deck, deckDispatch, storyAssetDeltas, saveCampaignLog]);

  const onCardPress = useCallback((card: Card) => {
    showCard(componentId, card.code, card, colors, true);
  }, [componentId, colors]);

  const renderDeltas = useCallback((cards: Card[], deltas: Slots) => {
    return map(
      sortBy(cards, card => card.name),
      card => (
        <CardSearchResult
          key={card.code}
          onPress={onCardPress}
          card={card}
          backgroundColor="transparent"
          control={{
            type: 'count',
            count: deltas[card.code],
            deltaCountMode: true,
          }}
        />
      )
    );
  }, [onCardPress]);

  const storyAssets = useMemo(() => campaignLog.storyAssets(investigator.code), [campaignLog, investigator]);
  const storyAssetCodes = useMemo(() => flatMap(storyAssetDeltas, (count, code) => count !== 0 ? code : []), [storyAssetDeltas]);
  const [storyAssetCards] = useCardList(storyAssetCodes, 'player');
  const storyAssetSection = useMemo(() => {
    if (!storyAssetCards.length) {
      return null;
    }
    return (
      <>
        <CardSectionHeader
          investigator={investigator}
          section={{ superTitle: t`Campaign cards` }}
        />
        { renderDeltas(storyAssetCards, storyAssetDeltas) }
      </>
    );
  }, [storyAssetDeltas, storyAssetCards, renderDeltas, investigator]);

  const saveButton = useMemo(() => {
    if (choices !== undefined || !editable) {
      return null;
    }
    if (deck) {
      return (
        <BasicButton
          title={t`Save deck changes`}
          onPress={save}
        />
      );
    }
    return null;
  }, [choices, editable, deck, save]);

  const campaignSection = useMemo(() => {
    return (
      <>
        { storyAssetSection }
        { saveButton }
      </>
    );
  }, [storyAssetSection, saveButton]);

  const selectDeck = useCallback(() => {
    campaignState.showChooseDeck(investigator);
  }, [campaignState, investigator]);

  const viewDeck = useCallback(() => {
    if (deck) {
      showDeckModal(componentId, deck, colors, investigator, { hideCampaign: true });
    }
  }, [componentId, colors, investigator, deck]);

  const deckButton = useMemo(() => {
    if (deck && choices !== undefined && choices.deckId) {
      return (
        <ShowDeckButton
          componentId={componentId}
          deckId={choices.deckId[0]}
          investigator={investigator}
        />
      );
    }
    if (!editable) {
      return null;
    }
    if (!deck) {
      return (
        <Button title={t`Select deck`} onPress={selectDeck} />
      );
    }
    return (
      <Button title={t`View deck`} onPress={viewDeck} />
    );
  }, [componentId, deck, editable, investigator, choices, selectDeck, viewDeck]);

  if (!find(storyAssetDeltas, (count: number) => count !== 0)) {
    return null;
  }
  const isYithian = (storyAssets[BODY_OF_A_YITHIAN] || 0) > 0;
  return (
    <InvestigatorRow
      investigator={investigator}
      yithian={isYithian}
      button={deckButton}
    >
      { campaignSection }
    </InvestigatorRow>
  );
}

SaveDeckRow.choiceId = computeChoiceId;
export default SaveDeckRow;