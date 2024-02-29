"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require("./util");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Kuroshiro Class
 */
var Kuroshiro = function () {
    /**
     * Constructor
     * @constructs Kuroshiro
     */
    function Kuroshiro() {
        _classCallCheck(this, Kuroshiro);

        this._analyzer = null;
    }

    /**
     * Initialize Kuroshiro
     * @memberOf Kuroshiro
     * @instance
     * @returns {Promise} Promise object represents the result of initialization
     */


    _createClass(Kuroshiro, [{
        key: "init",
        value: async function init(analyzer) {
            if (!analyzer || (typeof analyzer === "undefined" ? "undefined" : _typeof(analyzer)) !== "object" || typeof analyzer.init !== "function" || typeof analyzer.parse !== "function") {
                throw new Error("Invalid initialization parameter.");
            } else if (this._analyzer == null) {
                await analyzer.init();
                this._analyzer = analyzer;
            } else {
                throw new Error("Kuroshiro has already been initialized.");
            }
        }

        /**
         * Convert given string to target syllabary with options available
         * @memberOf Kuroshiro
         * @instance
         * @param {string} str Given String
         * @param {Object} [options] Settings Object
         * @param {string} [options.to="hiragana"] Target syllabary ["hiragana"|"katakana"|"romaji"]
         * @param {string} [options.mode="normal"] Convert mode ["normal"|"spaced"|"okurigana"|"furigana"]
         * @param {string} [options.romajiSystem="hepburn"] Romanization System ["nippon"|"passport"|"hepburn"]
         * @param {string} [options.delimiter_start="("] Delimiter(Start)
         * @param {string} [options.delimiter_end=")"] Delimiter(End)
         * @returns {Promise} Promise object represents the result of conversion
         */

    }, {
        key: "convert",
        value: async function convert(str, options) {
            options = options || {};
            options.to = options.to || "hiragana";
            options.mode = options.mode || "normal";
            options.romajiSystem = options.romajiSystem || _util.ROMANIZATION_SYSTEM.HEPBURN;
            options.delimiter_start = options.delimiter_start || "(";
            options.delimiter_end = options.delimiter_end || ")";
            str = str || "";

            if (["hiragana", "katakana", "romaji"].indexOf(options.to) === -1) {
                throw new Error("Invalid Target Syllabary.");
            }

            if (["normal", "spaced", "okurigana", "furigana"].indexOf(options.mode) === -1) {
                throw new Error("Invalid Conversion Mode.");
            }

            var ROMAJI_SYSTEMS = Object.keys(_util.ROMANIZATION_SYSTEM).map(function (e) {
                return _util.ROMANIZATION_SYSTEM[e];
            });
            if (ROMAJI_SYSTEMS.indexOf(options.romajiSystem) === -1) {
                throw new Error("Invalid Romanization System.");
            }

            var rawTokens = await this._analyzer.parse(str);
            var tokens = (0, _util.patchTokens)(rawTokens);

            if (options.mode === "normal" || options.mode === "spaced") {
                switch (options.to) {
                    case "katakana":
                        if (options.mode === "normal") {
                            return tokens.map(function (token) {
                                return token.reading;
                            }).join("");
                        }
                        return tokens.map(function (token) {
                            return token.reading;
                        }).join(" ");
                    case "romaji":
                        var romajiConv = function romajiConv(token) {
                            var preToken = void 0;
                            if ((0, _util.hasJapanese)(token.surface_form)) {
                                preToken = token.pronunciation || token.reading;
                            } else {
                                preToken = token.surface_form;
                            }
                            return (0, _util.toRawRomaji)(preToken, options.romajiSystem);
                        };
                        if (options.mode === "normal") {
                            return tokens.map(romajiConv).join("");
                        }
                        return tokens.map(romajiConv).join(" ");
                    case "hiragana":
                        for (var hi = 0; hi < tokens.length; hi++) {
                            if ((0, _util.hasKanji)(tokens[hi].surface_form)) {
                                if (!(0, _util.hasKatakana)(tokens[hi].surface_form)) {
                                    tokens[hi].reading = (0, _util.toRawHiragana)(tokens[hi].reading);
                                } else {
                                    // handle katakana-kanji-mixed tokens
                                    tokens[hi].reading = (0, _util.toRawHiragana)(tokens[hi].reading);
                                    var tmp = "";
                                    var hpattern = "";
                                    for (var hc = 0; hc < tokens[hi].surface_form.length; hc++) {
                                        if ((0, _util.isKanji)(tokens[hi].surface_form[hc])) {
                                            hpattern += "(.*)";
                                        } else {
                                            hpattern += (0, _util.isKatakana)(tokens[hi].surface_form[hc]) ? (0, _util.toRawHiragana)(tokens[hi].surface_form[hc]) : tokens[hi].surface_form[hc];
                                        }
                                    }
                                    var hreg = new RegExp(hpattern);
                                    var hmatches = hreg.exec(tokens[hi].reading);
                                    if (hmatches) {
                                        var pickKJ = 0;
                                        for (var hc1 = 0; hc1 < tokens[hi].surface_form.length; hc1++) {
                                            if ((0, _util.isKanji)(tokens[hi].surface_form[hc1])) {
                                                tmp += hmatches[pickKJ + 1];
                                                pickKJ++;
                                            } else {
                                                tmp += tokens[hi].surface_form[hc1];
                                            }
                                        }
                                        tokens[hi].reading = tmp;
                                    }
                                }
                            } else {
                                tokens[hi].reading = tokens[hi].surface_form;
                            }
                        }
                        if (options.mode === "normal") {
                            return tokens.map(function (token) {
                                return token.reading;
                            }).join("");
                        }
                        return tokens.map(function (token) {
                            return token.reading;
                        }).join(" ");
                    default:
                        throw new Error("Unknown option.to param");
                }
            } else if (options.mode === "okurigana" || options.mode === "furigana") {
                var notations = []; // [basic, basic_type[1=kanji,2=kana,3=others], notation, pronunciation]
                for (var i = 0; i < tokens.length; i++) {
                    var strType = (0, _util.getStrType)(tokens[i].surface_form);
                    switch (strType) {
                        case 0:
                            notations.push([tokens[i].surface_form, 1, (0, _util.toRawHiragana)(tokens[i].reading), tokens[i].pronunciation || tokens[i].reading]);
                            break;
                        case 1:
                            var pattern = "";
                            var isLastTokenKanji = false;
                            var subs = []; // recognize kanjis and group them
                            for (var c = 0; c < tokens[i].surface_form.length; c++) {
                                if ((0, _util.isKanji)(tokens[i].surface_form[c])) {
                                    if (!isLastTokenKanji) {
                                        // ignore successive kanji tokens (#10)
                                        isLastTokenKanji = true;
                                        pattern += "(.+)";
                                        subs.push(tokens[i].surface_form[c]);
                                    } else {
                                        subs[subs.length - 1] += tokens[i].surface_form[c];
                                    }
                                } else {
                                    isLastTokenKanji = false;
                                    subs.push(tokens[i].surface_form[c]);
                                    pattern += (0, _util.isKatakana)(tokens[i].surface_form[c]) ? (0, _util.toRawHiragana)(tokens[i].surface_form[c]) : tokens[i].surface_form[c];
                                }
                            }
                            var reg = new RegExp("^" + pattern + "$");
                            var matches = reg.exec((0, _util.toRawHiragana)(tokens[i].reading));
                            if (matches) {
                                var pickKanji = 1;
                                for (var c1 = 0; c1 < subs.length; c1++) {
                                    if ((0, _util.isKanji)(subs[c1][0])) {
                                        notations.push([subs[c1], 1, matches[pickKanji], (0, _util.toRawKatakana)(matches[pickKanji])]);
                                        pickKanji += 1;
                                    } else {
                                        notations.push([subs[c1], 2, (0, _util.toRawHiragana)(subs[c1]), (0, _util.toRawKatakana)(subs[c1])]);
                                    }
                                }
                            } else {
                                notations.push([tokens[i].surface_form, 1, (0, _util.toRawHiragana)(tokens[i].reading), tokens[i].pronunciation || tokens[i].reading]);
                            }
                            break;
                        case 2:
                            for (var c2 = 0; c2 < tokens[i].surface_form.length; c2++) {
                                notations.push([tokens[i].surface_form[c2], 2, (0, _util.toRawHiragana)(tokens[i].reading[c2]), tokens[i].pronunciation && tokens[i].pronunciation[c2] || tokens[i].reading[c2]]);
                            }
                            break;
                        case 3:
                            for (var c3 = 0; c3 < tokens[i].surface_form.length; c3++) {
                                notations.push([tokens[i].surface_form[c3], 3, tokens[i].surface_form[c3], tokens[i].surface_form[c3]]);
                            }
                            break;
                        default:
                            throw new Error("Unknown strType");
                    }
                }
                var result = "";
                switch (options.to) {
                    case "katakana":
                        if (options.mode === "okurigana") {
                            for (var n0 = 0; n0 < notations.length; n0++) {
                                if (notations[n0][1] !== 1) {
                                    result += notations[n0][0];
                                } else {
                                    result += notations[n0][0] + options.delimiter_start + (0, _util.toRawKatakana)(notations[n0][2]) + options.delimiter_end;
                                }
                            }
                        } else {
                            // furigana
                            for (var n1 = 0; n1 < notations.length; n1++) {
                                if (notations[n1][1] !== 1) {
                                    result += notations[n1][0];
                                } else {
                                    result += "<ruby>" + notations[n1][0] + "<rp>" + options.delimiter_start + "</rp><rt>" + (0, _util.toRawKatakana)(notations[n1][2]) + "</rt><rp>" + options.delimiter_end + "</rp></ruby>";
                                }
                            }
                        }
                        return result;
                    case "romaji":
                        if (options.mode === "okurigana") {
                            for (var n2 = 0; n2 < notations.length; n2++) {
                                if (notations[n2][1] !== 1) {
                                    result += notations[n2][0];
                                } else {
                                    result += notations[n2][0] + options.delimiter_start + (0, _util.toRawRomaji)(notations[n2][3], options.romajiSystem) + options.delimiter_end;
                                }
                            }
                        } else {
                            // furigana
                            result += "<ruby>";
                            for (var n3 = 0; n3 < notations.length; n3++) {
                                result += notations[n3][0] + "<rp>" + options.delimiter_start + "</rp><rt>" + (0, _util.toRawRomaji)(notations[n3][3], options.romajiSystem) + "</rt><rp>" + options.delimiter_end + "</rp>";
                            }
                            result += "</ruby>";
                        }
                        return result;
                    case "hiragana":
                        if (options.mode === "okurigana") {
                            for (var n4 = 0; n4 < notations.length; n4++) {
                                if (notations[n4][1] !== 1) {
                                    result += notations[n4][0];
                                } else {
                                    result += notations[n4][0] + options.delimiter_start + notations[n4][2] + options.delimiter_end;
                                }
                            }
                        } else {
                            // furigana
                            for (var n5 = 0; n5 < notations.length; n5++) {
                                if (notations[n5][1] !== 1) {
                                    result += notations[n5][0];
                                } else {
                                    result += "<ruby>" + notations[n5][0] + "<rp>" + options.delimiter_start + "</rp><rt>" + notations[n5][2] + "</rt><rp>" + options.delimiter_end + "</rp></ruby>";
                                }
                            }
                        }
                        return result;
                    default:
                        throw new Error("Invalid Target Syllabary.");
                }
            }
        }
    }]);

    return Kuroshiro;
}();

exports.default = Kuroshiro;