/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Image,
  Text,
  ListView,
  View
} from 'react-native';

var REQUEST_URL = 'https://raw.githubusercontent.com/facebook/react-native/master/docs/MoviesExample.json';

class ReactMovies extends Component {

  constructor(props) {
    super(props);
    // 自己定义state变量及初始化，
    // 在constructor生成的初始状态中添加一个空白的dataSource
    // 在state里用一个布尔型的属性(this.state.loaded)来判断数据加载是否已经完成

    this.state = {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      loaded: false,
    };
    // 在ES6中，如果在自定义的函数里使用了this关键字，则需要对其进行“绑定”操作，否则this的指向不对
    // 像下面这行代码，在constructor中使用bind是其中一种做法（还有一些其他做法，如使用箭头函数等）
    this.fetchData = this.fetchData.bind(this);
  }

  /**
   * 组件加载完毕之后，就可以向服务器请求数据。componentDidMount是React组件的一个生命周期方法，它会在组件刚加载完成的时候调用一次，以后不会再被调用。
   */
  componentDidMount() {
    this.fetchData();
  }

  /**
   * 在Promise调用链结束后执行this.setState({movies:data})。
   * 在React的工作机制下，setState会触发一次重新渲染的流程，此时render函数被触发，发现this.state.movies不再是null。
   * 在Promise调用链的最后调用了done() —— 这样可以抛出异常而不是简单忽略
   */
  fetchData() {
    fetch(REQUEST_URL)
      .then((response) => response.json())
      .then((responseData) => {
        // 注意，这里使用了this关键字，为了保证this在调用时仍然指向当前组件，我们需要对其进行“绑定”操作
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(responseData.movies),
          loaded: true,
        });
      })
      .done();
  }

  render() {
    if (!this.state.loaded) {
      return this.renderLoadingView();
    }

    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this.renderMovie}
        style={styles.listview}
        />
    );

  }
  renderMovie(movie) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: movie.posters.thumbnail }}
          style={styles.thumbnail}
          />
        <View style={styles.rightContainer}>
          <Text style={styles.title}>{movie.title}</Text>
          <Text style={styles.year}>{movie.year}</Text>
        </View>
      </View>

    );
  }

  renderLoadingView() {
    return (
      <View style={styles.container}>
        <Text>
          Loading movies...
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',//让容器内成员从左到右横向布局
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  rightContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  year: {
    textAlign: 'center',
  },
  thumbnail: {
    width: 66,
    height: 88,
  },
  listview: {
    paddingTop: 20,
    backgroundColor: '#F5FCFF',
  },
});

AppRegistry.registerComponent('ReactMovies', () => ReactMovies);
