"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWikimediaImage = void 0;
function createWikimediaImage(image, width) {
    if (width === void 0) { width = 300; }
    return "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/".concat(encodeURIComponent(image), "&width=").concat(width);
}
exports.createWikimediaImage = createWikimediaImage;
