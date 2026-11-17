import Foundation

/// A character with the words used to search for it.
struct Pick: Hashable {
    let char: String
    let name: String
}

private func pack(_ s: String) -> [Pick] {
    s.split(separator: "|").compactMap { part in
        let bits = part.split(separator: ":", maxSplits: 1)
        guard bits.count == 2 else { return nil }
        return Pick(char: String(bits[0]), name: String(bits[1]))
    }
}

enum PickerData {
    static let emojiCategories: [(String, [Pick])] = [
        ("Smileys", pack("😀:grinning happy|😂:joy laugh tears|🥹:holding back tears|😊:smile blush|😍:heart eyes love|😘:kiss|😎:cool sunglasses|🤔:thinking|😴:sleep|😭:cry sob|😡:angry|🥳:party celebrate|😇:angel|🙄:eye roll|😅:sweat smile|🤯:mind blown")),
        ("Gestures", pack("👍:thumbs up yes|👎:thumbs down no|👌:ok perfect|🙏:pray thanks please|👏:clap applause|🙌:raise hands|💪:strong muscle|🤝:handshake deal|✌️:peace victory|👀:eyes look|🫶:heart hands|🤲:dua palms")),
        ("Nature", pack("🐅:tiger bengal|🐐:goat|🐈:cat|🐕:dog|🦋:butterfly|🌻:sunflower|🌧️:rain cloud|🌙:moon crescent|☀️:sun|⭐:star|🔥:fire lit|🌊:wave water")),
        ("Food", pack("🍋:lemon|🥭:mango|🌶️:chili pepper hot|🍕:pizza|🍔:burger|🍚:rice|🍵:tea cup|☕:coffee|🍰:cake|🍧:shaved ice|🍉:watermelon|🥥:coconut")),
        ("Travel", pack("✈️:airplane flight|🚗:car|🛺:auto rickshaw cng|🚲:bicycle|🚆:train|⛵:boat|🏠:home house|🏖️:beach|🗺️:map|🪁:kite|🚀:rocket launch|⛰️:mountain")),
        ("Objects", pack("💻:laptop mac|📱:phone|⌚:watch|📷:camera|🎧:headphones|📎:paperclip|📌:pin|✂️:scissors cut|📋:clipboard|🏆:trophy win|👜:bag|💡:idea bulb")),
        ("Hearts", pack("❤️:red heart love|🧡:orange heart|💛:yellow heart|💚:green heart|💙:blue heart|💜:purple heart|🖤:black heart|💔:broken heart|💯:hundred|✅:check done|❓:question|🔽:down triangle")),
        ("All", allEmoji),
    ]

    /// Every single-character emoji macOS knows, named from Unicode, so search finds anything.
    static let allEmoji: [Pick] = {
        var out: [Pick] = []
        var seen = Set<String>()
        let ranges: [ClosedRange<UInt32>] = [0x1F600...0x1F64F, 0x1F900...0x1F9FF, 0x1FA70...0x1FAFF,
                                             0x1F300...0x1F5FF, 0x1F680...0x1F6FF, 0x2600...0x27BF]
        for r in ranges {
            for v in r {
                guard let sc = Unicode.Scalar(v), sc.properties.isEmoji else { continue }
                if (0x1F3FB...0x1F3FF).contains(v) { continue } // skin tone swatches
                // Characters that default to text style get the emoji-style selector.
                let ch = sc.properties.isEmojiPresentation ? String(sc) : String(sc) + "\u{FE0F}"
                guard seen.insert(ch).inserted else { continue }
                out.append(Pick(char: ch, name: (sc.properties.name ?? "").lowercased()))
            }
        }
        return out
    }()

    static let kaomoji: [(String, [String])] = [
        ("Happy", ["(❁´◡`❁)", "(●'◡'●)", "╰(*°▽°*)╯", "(≧▽≦)", "^_^", ":-D", "(＾▽＾)", "ヽ(・∀・)ﾉ", "(◕‿◕)"]),
        ("Love", ["(♥ω♥)", "(づ￣ ³￣)づ", "(´∀｀)♡", "♡(˃͈ દ ˂͈ ༶ )", "(｡♥‿♥｡)", "( ˘ ³˘)♥"]),
        ("Sad", ["(┬┬﹏┬┬)", "(╥_╥)", "(；′⌒`)", "(ಥ﹏ಥ)", "(T_T)", "( ._. )"]),
        ("Angry", ["ಠ_ಠ", "(╯°□°）╯︵ ┻━┻", "(ノಠ益ಠ)ノ", "(¬_¬)", "ಠ益ಠ", "(｀Д´)"]),
        ("Classic", [";)", ":-)", ":)", "^_~", ";-)", "^____^", ":-P", "XD", "¯\\_(ツ)_/¯"]),
    ]

    static let symbols: [(String, [Pick])] = [
        ("Punctuation", pack("–:en dash|—:em dash|•:bullet|…:ellipsis|§:section|¶:paragraph|«:left quote|»:right quote|“:open quote|”:close quote|†:dagger|‽:interrobang")),
        ("Currency", pack("৳:taka bdt|$:dollar|€:euro|£:pound|¥:yen|₹:rupee|₩:won|₽:ruble|₿:bitcoin|¢:cent")),
        ("Math", pack("±:plus minus|×:multiply times|÷:divide|≠:not equal|≈:approximately|≤:less equal|≥:greater equal|∞:infinity|√:square root|π:pi|∑:sum|°:degree|²:squared|³:cubed|½:half|‰:per mille")),
        ("Arrows", pack("←:left arrow|→:right arrow|↑:up arrow|↓:down arrow|↔:left right|⇒:implies|↩:return|↗:up right|⟳:reload")),
        ("Mac", pack("⌘:command cmd|⌥:option alt|⇧:shift|⌃:control ctrl|⎋:escape|⏎:return enter|⌫:delete backspace|⇥:tab|␣:space")),
        ("Bangla", pack("।:dari full stop|॥:double dari|০:zero|১:one|২:two|৩:three|৪:four|৫:five|৬:six|৭:seven|৮:eight|৯:nine|ঃ:bisarga|ঁ:chandrabindu")),
        ("Marks", pack("©:copyright|®:registered|™:trademark|✓:check|✗:cross|★:star|☆:star outline|♪:music note|é:e acute|ñ:n tilde|ü:u umlaut|℃:celsius")),
    ]

    static func emojiName(_ e: String) -> String {
        for (_, list) in emojiCategories { if let p = list.first(where: { $0.char == e }) { return p.name } }
        return "recent"
    }
}
