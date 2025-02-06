"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preloadImage = exports.checkCorrect = exports.getRandomItem = void 0;
var image_1 = require("./image");
function getRandomItem(deck, played) {
    var periods = [
        [-100000, 1000],
        [1000, 1800],
        [1800, 2020],
    ];
    var _a = periods[Math.floor(Math.random() * periods.length)], fromYear = _a[0], toYear = _a[1];
    var avoidPeople = Math.random() > 0.5;
    var candidates = deck.filter(function (candidate) {
        if (avoidPeople && candidate.instance_of.includes("human")) {
            return false;
        }
        if (candidate.year < fromYear || candidate.year > toYear) {
            return false;
        }
        if (tooClose(candidate, played)) {
            return false;
        }
        return true;
    });
    if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return deck[Math.floor(Math.random() * deck.length)];
}
exports.getRandomItem = getRandomItem;
function tooClose(item, played) {
    var distance = (played.length < 40) ? 5 : 1;
    if (played.length < 11)
        distance = 110 - 10 * played.length;
    return played.some(function (p) { return Math.abs(item.year - p.year) < distance; });
}
function checkCorrect(played, item, index) {
    var sorted = __spreadArray(__spreadArray([], played, true), [item], false).sort(function (a, b) { return a.year - b.year; });
    var correctIndex = sorted.findIndex(function (i) {
        return i.id === item.id;
    });
    if (index !== correctIndex) {
        return { correct: false, delta: correctIndex - index };
    }
    return { correct: true, delta: 0 };
}
exports.checkCorrect = checkCorrect;
function preloadImage(url) {
    var img = new Image();
    img.src = (0, image_1.createWikimediaImage)(url);
    return img;
}
exports.preloadImage = preloadImage;
