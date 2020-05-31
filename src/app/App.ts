import { Navigation } from 'react-native-navigation';
import { Linking, YellowBox } from 'react-native';
import DeepLinking from 'react-native-deep-linking';
import { Action, Store } from 'redux';
import { t } from 'ttag';

import { changeLocale } from './i18n';
import { iconsLoaded, iconsMap } from './NavIcons';
import COLORS from 'styles/colors';
import { AppState } from 'reducers';

export default class App {
  started: boolean;
  currentLang: string;

  constructor(store: Store<AppState, Action>) {
    this.started = false;
    this.currentLang = 'en';
    store.subscribe(this.onStoreUpdate.bind(this, store));

    this.onStoreUpdate(store);
  }

  onStoreUpdate(store: Store<AppState, Action>) {
    const lang = store.getState().cards.lang || 'en';

    // handle a root change
    // if your app doesn't change roots in runtime, you can remove onStoreUpdate() altogether
    if (!this.started || this.currentLang !== lang) {
      this.started = true;
      this.currentLang = lang;
      iconsLoaded.then(() => {
        this.startApp(lang);
      }).catch(error => console.log(error));
    }
  }

  _handleUrl = ({ url }: { url: string }) => {
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        DeepLinking.evaluateUrl(url);
      }
    });
  };

  startApp(lang?: string) {
    changeLocale(lang || 'en');
    YellowBox.ignoreWarnings([
      'Warning: Failed prop type: DialogSwitch: prop type `labelStyle` is invalid;',
      'Warning: `flexWrap: `wrap`` is not supported with the `VirtualizedList` components.' +
      'Consider using `numColumns` with `FlatList` instead.',
    ]);

    const browseCards = {
      component: {
        name: 'Browse.Cards',
        options: {
          topBar: {
            title: {
              text: t`Player Cards`,
            },
          },
        },
      },
    };
    const browseDecks = {
      component: {
        name: 'My.Decks',
        options: {
          topBar: {
            title: {
              text: t`Decks`,
            },
            rightButtons: [{
              icon: iconsMap.add,
              id: 'add',
              color: COLORS.navButton,
              testID: t`New Deck`,
            }],
          },
        },
      },
    };
    const browseCampaigns = {
      component: {
        name: 'My.Campaigns',
        options: {
          topBar: {
            title: {
              text: t`Campaigns`,
            },
            rightButtons: [{
              icon: iconsMap.add,
              id: 'add',
              color: COLORS.navButton,
              testID: t`New Campaign`,
            }],
          },
        },
      },
    };
    const settings = {
      component: {
        name: 'Settings',
        options: {
          topBar: {
            title: {
              text: t`Settings`,
            },
          },
        },
      },
    };
    const tabs = [{
      stack: {
        children: [browseCards],
        options: {
          bottomTab: {
            text: t`Cards`,
            icon: iconsMap.cards,
          },
        },
      },
    }, {
      stack: {
        children: [browseDecks],
        options: {
          bottomTab: {
            text: t`Decks`,
            icon: iconsMap.deck,
          },
        },
      },
    }, {
      stack: {
        children: [browseCampaigns],
        options: {
          bottomTab: {
            text: t`Campaigns`,
            icon: iconsMap.book,
          },
        },
      },
    }, {
      stack: {
        children: [settings],
        options: {
          bottomTab: {
            text: t`Settings`,
            icon: iconsMap.settings,
          },
        },
      },
    }];

    Navigation.setDefaultOptions({
      topBar: {
        leftButtonColor: COLORS.lightBlue,
        rightButtonColor: COLORS.lightBlue,
        title: {
          color: COLORS.darkTextColor,
        },
        background: {
          color: COLORS.backgroundColor,
        },
      },
      layout: {
        backgroundColor: COLORS.backgroundColor,
      },
      bottomTab: {
        textColor: COLORS.lightTextColor,
        selectedIconColor: COLORS.lightBlue,
        selectedTextColor: COLORS.lightBlue,
      },
    });

    Navigation.setRoot({
      root: {
        bottomTabs: {
          children: tabs,
        },
      },
    });
    Linking.addEventListener('url', this._handleUrl);

    // We handle scrollapp and https (universal) links
    DeepLinking.addScheme('arkhamcards://');

    Linking.getInitialURL().then((url) => {
      if (url) {
        this._handleUrl({ url });
      }
    });
  }
}
