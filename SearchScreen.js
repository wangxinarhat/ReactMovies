import React, { Component } from 'react';
import {
    ActivityIndicator,
    ListView,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import getImageSource from './getImageSource';
import MovieCell from './MovieCell';
import MovieScreen from'./MovieScreen';
import SearchBar from'SearchBar';

var TimerMixin = require('react-timer-mixin');
var invariant = require('fbjs/lib/invariant');
var dismissKeyboard = require('dismissKeyboard');

var API_URL = 'http://api.rottentomatoes.com/api/public/v1.0/';
var API_KEYS = [
    '7waqfqbprs7pajbz28mqf6vz',
    // 'y4vwv8m33hed9ety83jmv52f', Fallback api_key
];

var resultsCache = {
    dataForQuery: {},
    nextPageNumberForQuery: {},
    totalForQuery: {},
};
var LOADING = {};

export default class SearchScreen extends React.Component {
    //  mixins: [TimerMixin],
    //   timeoutID: (null: any),

    getInitialState() {
        return {
            isLoading: false,
            isLoadingTail: false,
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => row1 !== row2,
            }),
            filter: '',
            queryNumber: 0,
        };
    }

    componentDidMount() {
        this.searchMovies('');
    }

    _urlForQueryAndPage(query, pageNumber) {
        var apiKey = API_KEYS[this.state.queryNumber % API_KEYS.length];
        if (query) {
            return (
                API_URL + 'movies.json?apikey=' + apiKey + '&q=' +
                encodeURIComponent(query) + '&page_limit=20&page=' + pageNumber
            );
        } else {
            // With no query, load latest movies
            return (
                API_URL + 'lists/movies/in_theaters.json?apikey=' + apiKey +
                '&page_limit=20&page=' + pageNumber
            );
        }
    }

    searchMovies(query) {
        this.timeoutID = null;

        this.setState({ filter: query });

        var cachedResultsForQuery = resultsCache.dataForQuery[query];
        if (cachedResultsForQuery) {
            if (!LOADING[query]) {
                this.setState({
                    dataSource: this.getDataSource(cachedResultsForQuery),
                    isLoading: false
                });
            } else {
                this.setState({ isLoading: true });
            }
            return;
        }

        LOADING[query] = true;
        resultsCache.dataForQuery[query] = null;
        this.setState({
            isLoading: true,
            queryNumber: this.state.queryNumber + 1,
            isLoadingTail: false,
        });

        fetch(this._urlForQueryAndPage(query, 1))
            .then((response) => response.json())
            .catch((error) => {
                LOADING[query] = false;
                resultsCache.dataForQuery[query] = undefined;

                this.setState({
                    dataSource: this.getDataSource([]),
                    isLoading: false,
                });
            })
            .then((responseData) => {
                LOADING[query] = false;
                resultsCache.totalForQuery[query] = responseData.total;
                resultsCache.dataForQuery[query] = responseData.movies;
                resultsCache.nextPageNumberForQuery[query] = 2;

                if (this.state.filter !== query) {
                    // do not update state if the query is stale
                    return;
                }

                this.setState({
                    isLoading: false,
                    dataSource: this.getDataSource(responseData.movies),
                });
            })
            .done();
    }


    hasMore() {
        var query = this.state.filter;
        if (!resultsCache.dataForQuery[query]) {
            return true;
        }
        return (
            resultsCache.totalForQuery[query] !==
            resultsCache.dataForQuery[query].length
        );
    }



    onEndReached() {
        var query = this.state.filter;
        if (!this.hasMore() || this.state.isLoadingTail) {
            // We're already fetching or have all the elements so noop
            return;
        }

        if (LOADING[query]) {
            return;
        }

        LOADING[query] = true;
        this.setState({
            queryNumber: this.state.queryNumber + 1,
            isLoadingTail: true,
        });

        var page = resultsCache.nextPageNumberForQuery[query];
        invariant(page != null, 'Next page number for "%s" is missing', query);
        fetch(this._urlForQueryAndPage(query, page))
            .then((response) => response.json())
            .catch((error) => {
                console.error(error);
                LOADING[query] = false;
                this.setState({
                    isLoadingTail: false,
                });
            })
            .then((responseData) => {
                var moviesForQuery = resultsCache.dataForQuery[query].slice();

                LOADING[query] = false;
                // We reached the end of the list before the expected number of results
                if (!responseData.movies) {
                    resultsCache.totalForQuery[query] = moviesForQuery.length;
                } else {
                    for (var i in responseData.movies) {
                        moviesForQuery.push(responseData.movies[i]);
                    }
                    resultsCache.dataForQuery[query] = moviesForQuery;
                    resultsCache.nextPageNumberForQuery[query] += 1;
                }

                if (this.state.filter !== query) {
                    // do not update state if the query is stale
                    return;
                }

                this.setState({
                    isLoadingTail: false,
                    dataSource: this.getDataSource(resultsCache.dataForQuery[query]),
                });
            })
            .done();
    }


    getDataSource(movies) {
        return this.state.dataSource.cloneWithRows(movies);
    }


    selectMovie(movie) {
        if (Platform.OS === 'ios') {
            this.props.navigator.push({
                title: movie.title,
                component: MovieScreen,
                passProps: { movie },
            });
        } else {
            dismissKeyboard();
            this.props.navigator.push({
                title: movie.title,
                name: 'movie',
                movie: movie,
            });
        }
    }


    onSearchChange(event) {
        var filter = event.nativeEvent.text.toLowerCase();

        this.clearTimeout(this.timeoutID);
        this.timeoutID = this.setTimeout(() => this.searchMovies(filter), 100);
    }

    renderFooter() {
        if (!this.hasMore() || !this.state.isLoadingTail) {
            return <View style={styles.scrollSpinner} />;
        }

        return <ActivityIndicator style={styles.scrollSpinner} />;
    }


    renderSeparator(
        sectionID,
        rowID,
        adjacentRowHighlighted
    ) {
        var style = styles.rowSeparator;
        if (adjacentRowHighlighted) {
            style = [style, styles.rowSeparatorHide];
        }
        return (
            <View key={'SEP_' + sectionID + '_' + rowID}  style={style}/>
        );
    }


    // highlightRowFunc: (sectionID: ?number | string, rowID: ?number | string) => void,
    renderRow(movie, sectionID, rowID, highlightRowFunc: (sectionID: ?number | string, rowID: ?number | string) => void, ) {
        return (
            <MovieCell
                key={movie.id}
                onSelect={() => this.selectMovie(movie) }
                onHighlight={() => highlightRowFunc(sectionID, rowID) }
                onUnhighlight={() => highlightRowFunc(null, null) }
                movie={movie}
                />
        );
    }


    render() {
        var content = this.state.dataSource.getRowCount() === 0 ?
            <NoMovies
                filter={this.state.filter}
                isLoading={this.state.isLoading}
                /> :
            <ListView
                ref="listview"
                renderSeparator={this.renderSeparator}
                dataSource={this.state.dataSource}
                renderFooter={this.renderFooter}
                renderRow={this.renderRow}
                onEndReached={this.onEndReached}
                automaticallyAdjustContentInsets={false}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps={true}
                showsVerticalScrollIndicator={false}
                />;

        return (
            <View style={styles.container}>
                <SearchBar
                    onSearchChange={this.onSearchChange}
                    isLoading={this.state.isLoading}
                    onFocus={() =>
                        this.refs.listview && this.refs.listview.getScrollResponder().scrollTo({ x: 0, y: 0 }) }
                    />
                <View style={styles.separator} />
                {content}
            </View>
        );
    }


}

class NoMovies extends React.Component {
    render() {
        var text = '';
        if (this.props.filter) {
            text = `No results for "${this.props.filter}"`;
        } else if (!this.props.isLoading) {
            // If we're looking at the latest movies, aren't currently loading, and
            // still have no results, show a message
            text = 'No movies found';
        }

        return (
            <View style={[styles.container, styles.centerText]}>
                <Text style={styles.noMoviesText}>{text}</Text>
            </View>
        );
    }
}

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    centerText: {
        alignItems: 'center',
    },
    noMoviesText: {
        marginTop: 80,
        color: '#888888',
    },
    separator: {
        height: 1,
        backgroundColor: '#eeeeee',
    },
    scrollSpinner: {
        marginVertical: 20,
    },
    rowSeparator: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        height: 1,
        marginLeft: 4,
    },
    rowSeparatorHide: {
        opacity: 0.0,
    },
});
