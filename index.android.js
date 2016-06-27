/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  BackAndroid,
  Navigator,
  StyleSheet,
  ToolbarAndroid,
  View,
} from 'react-native';


import MovieScreen from './MovieScreen';
import SearchScreen from './SearchScreen';

var _navigator;
BackAndroid.addEventListener('hardwareBackPress', () => {
  if (_navigator && _navigator.getCurrentRoutes().length > 1) {
    _navigator.pop();
    return true;
  }
  return false;
});

var RouteMapper = function (route, navigationOperations, onComponentRef) {
  _navigator = navigationOperations;
  if (route.name === 'search') {
    return (
      <SearchScreen navigator={navigationOperations} />
    );
  } else if (route.name === 'movie') {
    return (
      <View style={{ flex: 1 }}>
        <ToolbarAndroid
          actions={[]}
          navIcon={require('image!android_back_white') }
          onIconClicked={navigationOperations.pop}
          style={styles.toolbar}
          titleColor="white"
          title={route.movie.title} />
        <MovieScreen
          style={{ flex: 1 }}
          navigator={navigationOperations}
          movie={route.movie}
          />
      </View>
    );
  }
};

export default class ReactMovies extends Component {
  render() {
    var initialRoute = { name: 'search' };
    return (
      <Navigator
        style={styles.container}
        initialRoute={initialRoute}
        configureScene={() => Navigator.SceneConfigs.FadeAndroid}
        renderScene={RouteMapper}
        />
    );
  }

}
var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  toolbar: {
    backgroundColor: '#a9a9a9',
    height: 56,
  },
});

AppRegistry.registerComponent('ReactMovies', () => ReactMovies);
