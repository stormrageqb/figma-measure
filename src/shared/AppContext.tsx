import React, { FunctionComponent } from 'react';
import PropTypes from 'prop-types';

const AppContext = React.createContext(null);

interface Props {
  selection: [];
  tooltipSettings?: {
    distance?: number;
    padding?: number;
    backgroundColor?: string;
    fontColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fontSize?: number;
  };
}

export const AppProvider: FunctionComponent<Props> = props => {
  return (
    <AppContext.Provider
      value={{
        selection: props.selection,
        tooltipSettings: props.tooltipSettings,
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
};

export const withAppContext = <Comp extends React.ComponentType<any>>(
  Component: Comp
): React.ComponentClass<any> => {
  return class ComponentWithSocket extends React.Component<any> {
    static propTypes = {
      Component: PropTypes.element
    };

    static displayName = `${Component.displayName || Component.name}`;

    render() {
      return (
        <AppContext.Consumer>
          {data => <Component {...(this.props as any)} appData={data} />}
        </AppContext.Consumer>
      );
    }
  };
};
