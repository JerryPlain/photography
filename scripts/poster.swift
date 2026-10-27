import AVFoundation
import AppKit
let args = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.maximumSize = CGSize(width: Int(args[3]) ?? 2000, height: Int(args[3]) ?? 2000)
let dur = CMTimeGetSeconds(asset.duration)
let t = CMTime(seconds: min(max(dur * 0.35, 0.1), max(dur - 0.1, 0.1)), preferredTimescale: 600)
let cg = try gen.copyCGImage(at: t, actualTime: nil)
let rep = NSBitmapImageRep(cgImage: cg)
let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.8])!
try data.write(to: URL(fileURLWithPath: args[2]))
print("\(cg.width)x\(cg.height) dur=\(dur)")
