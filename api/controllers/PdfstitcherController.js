/**
 * PdfstitcherController
 *
 * @description :: Server-side logic for managing pdfstitchers
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  /**
   * `PdfstitcherController.index()`
   */
  index: function (req, res) {
    return res.view('pdfstitcher');
  },

  'pdfstitcher': function (req, res) {
    return res.view('pdfstitcher');
  }
};

