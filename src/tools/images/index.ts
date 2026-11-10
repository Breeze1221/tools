import type { DefinedTool } from '../define-tool'

import { tool as aiImageGen } from './ai-image-gen'
import { tool as barcodeGenerator } from './barcode-generator'
import { tool as base64ImageConverter } from './base64-image-converter'
import { tool as exifViewerCleaner } from './exif-viewer-cleaner'
import { tool as faviconGenerator } from './favicon-generator'
import { tool as gifBgRemover } from './gif-bg-remover'
import { tool as gifCompressor } from './gif-compressor'
import { tool as gifEditor } from './gif-editor'
import { tool as gifMaker } from './gif-maker'
import { tool as imageStack } from './image-stack'
import { tool as imageToBeads } from './image-to-beads'
import { tool as qrCode } from './qr-code'
import { tool as wifiQrCodeGenerator } from './wifi-qr-code-generator'
import { tool as imageCompressor } from './image-compressor'
import { tool as imageColorExtractor } from './image-color-extractor'
import { tool as imageWatermarker } from './image-watermarker'
import { tool as imageResizer } from './image-resizer'
import { tool as imageBatchRenamer } from './image-batch-renamer'
import { tool as svgPlaceholderGenerator } from './svg-placeholder-generator'
import { tool as imageRotateFlip } from './image-rotate-flip'
import { tool as imageSplitter } from './image-splitter'
import { tool as imageFilter } from './image-filter'
import { tool as imageBorderFrame } from './image-border-frame'
import { tool as imageToPdf } from './image-to-pdf'

export const imagesTools: readonly DefinedTool[] = [
  qrCode,
  wifiQrCodeGenerator,
  imageCompressor,
  faviconGenerator,
  barcodeGenerator,
  exifViewerCleaner,
  gifCompressor,
  gifMaker,
  gifEditor,
  gifBgRemover,
  imageStack,
  imageToBeads,
  aiImageGen,
  imageColorExtractor,
  imageWatermarker,
  imageResizer,
  imageBatchRenamer,
  base64ImageConverter,
  svgPlaceholderGenerator,
  imageRotateFlip,
  imageSplitter,
  imageFilter,
  imageBorderFrame,
  imageToPdf,
]
