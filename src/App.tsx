import { reaction, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { useEffect } from 'preact/hooks';
import React, { FunctionComponent } from 'react';
import * as ReactDOM from 'react-dom';
import {
  MemoryRouter as Router,
  Route,
  Routes,
  Link,
  LinkProps,
  useResolvedPath,
  useMatch,
} from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';

import EventEmitter from './shared/EventEmitter';
import { Alignments, PluginNodeData } from './shared/interfaces';
import { getStoreFromMain, StoreProvider, trunk, useStore } from './store';
import {
  DEFAULT_COLOR,
  getColorByTypeAndSolidColor,
  GlobalStyle,
  theme,
} from './style';
import Home from './views/Home';
import Tooltip from './views/Tooltip';

import './ui.css';
import How from './views/How';

function CustomLink({ children, to, ...props }: LinkProps) {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: true });

  return (
    <Link className={match ? 'active' : ''} to={to} {...props}>
      {children}
    </Link>
  );
}

const App: FunctionComponent = observer(() => {
  const store = useStore();

  useEffect(() => {
    // check visibility
    EventEmitter.ask('get visibility').then((visibility: boolean) => {
      store.setVisibility(visibility);
    });

    // check selection
    EventEmitter.ask('current selection').then((data: string[]) =>
      store.setSelection(data)
    );

    EventEmitter.on('selection', (data) => store.setSelection(data));

    EventEmitter.on('set visibility', (data) => store.setVisibility(data));

    return () => EventEmitter.remove('selection');
  }, []);

  // set data from selection
  useEffect(
    () =>
      reaction(
        () => store.selection.slice(),
        () => {
          const selection = toJS(store.selection);
          if (selection.length > 0) {
            try {
              const padding = selection[0]?.padding || {};
              const data: Partial<PluginNodeData> = selection[0]?.data || null;

              if (data && !store.detached) {
                // padding
                if (Object.keys(padding).length > 0) {
                  if (!data.surrounding) {
                    // @ts-expect-error it filled afterwarts
                    data.surrounding = {};
                  }

                  for (const direction of Object.keys(Alignments)) {
                    data.surrounding[`${direction.toLowerCase()}Padding`] =
                      !!padding[direction];
                  }
                } else {
                  for (const direction of Object.keys(Alignments)) {
                    data.surrounding[`${direction.toLowerCase()}Padding`] =
                      false;
                  }
                }

                if (Object.keys(data?.surrounding).length > 0) {
                  store.setSurrounding(data.surrounding, true);
                } else {
                  store.resetSurrounding();
                }

                store.setAllNodeMeasurementData(data);
              }
            } catch {
              store.resetSurrounding();
            }
          } else {
            store.resetSurrounding();
          }
        }
      ),
    []
  );

  return (
    <ThemeProvider
      theme={{
        color: store?.color || DEFAULT_COLOR,
        softColor: getColorByTypeAndSolidColor(store.color, 'soft'),
        hoverColor: getColorByTypeAndSolidColor(store.color, 'hover'),
        ...theme,
      }}
    >
      <GlobalStyle />

      <Main>
        <Navigation>
          <ul>
            <li>
              <CustomLink to="/">Measurement</CustomLink>
            </li>
            <li>
              <CustomLink to="/tooltip">Tooltip</CustomLink>
            </li>
            <li>
              <CustomLink to="/how">How?</CustomLink>
            </li>
          </ul>
        </Navigation>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tooltip" element={<Tooltip />} />
          <Route path="/How" element={<How />} />
        </Routes>
      </Main>
    </ThemeProvider>
  );
});

getStoreFromMain().then((store) =>
  trunk.init(store).then(() =>
    ReactDOM.render(
      <StoreProvider>
        <Router>
          <App />
        </Router>
      </StoreProvider>,
      document.getElementById('app')
    )
  )
);

const Main = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const Navigation = styled.nav`
  position: relative;
  overflow: hidden;
  height: 42px;
  border-width: 0 0 1px;
  border-color: #eee;
  border-style: solid;
  width: 100%;
  padding: 0 12px;
  font-size: 11px;
  ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    height: 100%;
    li {
      align-self: center;
      a {
        color: #b2b2b2;
        text-decoration: none;
        &.active {
          color: #000;
        }
      }
      &:last-child {
        margin-left: auto;
      }
      &:first-child {
        margin-right: 21px;
      }
    }
  }
`;
