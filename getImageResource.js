export default class getImageSource {

  getImageSource(movie: Object, kind: ?string): { uri: ?string } {
    var uri = movie && movie.posters ? movie.posters.thumbnail : null;
    if (uri && kind) {
      uri = uri.replace('tmb', kind);
    }
    return { uri };
  }

}