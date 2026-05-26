import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let arguments = CommandLine.arguments

guard arguments.count == 3 else {
    fputs("Usage: render-icon.swift <glyph.png> <output.png>\n", stderr)
    exit(64)
}

let glyphURL = URL(fileURLWithPath: arguments[1])
let outputURL = URL(fileURLWithPath: arguments[2])

guard
    let glyphSource = CGImageSourceCreateWithURL(glyphURL as CFURL, nil),
    let glyph = CGImageSourceCreateImageAtIndex(glyphSource, 0, nil)
else {
    fputs("Could not read icon glyph at \(glyphURL.path)\n", stderr)
    exit(66)
}

let size = 1024
let bounds = CGRect(x: 0, y: 0, width: size, height: size)

guard
    let colorSpace = CGColorSpace(name: CGColorSpace.displayP3) ?? CGColorSpace(name: CGColorSpace.sRGB),
    let context = CGContext(
        data: nil,
        width: size,
        height: size,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )
else {
    fputs("Could not create icon render context\n", stderr)
    exit(70)
}

context.clear(bounds)

let cornerRadius: CGFloat = 224
let roundedRect = CGPath(
    roundedRect: bounds,
    cornerWidth: cornerRadius,
    cornerHeight: cornerRadius,
    transform: nil
)

context.saveGState()
context.addPath(roundedRect)
context.clip()

let gradientColors = [
    CGColor(red: 0.23193, green: 0.41350, blue: 0.80588, alpha: 1),
    CGColor(red: 0.38860, green: 0.77688, blue: 0.96841, alpha: 1),
] as CFArray

if let gradient = CGGradient(colorsSpace: colorSpace, colors: gradientColors, locations: [0, 1]) {
    context.drawLinearGradient(
        gradient,
        start: CGPoint(x: bounds.midX, y: bounds.minY),
        end: CGPoint(x: bounds.midX, y: bounds.maxY),
        options: [.drawsBeforeStartLocation, .drawsAfterEndLocation]
    )
}

context.saveGState()
context.setShadow(
    offset: CGSize(width: 0, height: -28),
    blur: 26,
    color: CGColor(gray: 0, alpha: 0.5)
)
context.setAlpha(0.88)
context.draw(glyph, in: bounds)
context.restoreGState()

context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.16))
context.addPath(roundedRect)
context.fillPath()

context.restoreGState()

guard
    let image = context.makeImage(),
    let destination = CGImageDestinationCreateWithURL(
        outputURL as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
    )
else {
    fputs("Could not create rendered icon PNG at \(outputURL.path)\n", stderr)
    exit(70)
}

CGImageDestinationAddImage(destination, image, nil)

guard CGImageDestinationFinalize(destination) else {
    fputs("Could not write rendered icon to \(outputURL.path)\n", stderr)
    exit(73)
}
