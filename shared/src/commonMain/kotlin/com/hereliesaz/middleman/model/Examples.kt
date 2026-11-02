package com.hereliesaz.middleman.model

/**
 * Illustrative walkthroughs of contrastruction, shown in onboarding as "how it works".
 * They are not playable sessions; real mediations start empty.
 */
data class Walkthrough(
    val title: String,
    val context: String,
    val people: Pair<String, String>,
    val raw: Pair<String, String>,
    val heard: String,
    val misread: String,
    val contrast: String,
    val commonGround: String,
    val question: String,
    val bridge: String,
)

val Walkthroughs = listOf(
    Walkthrough(
        title = "The anniversary dinner",
        context = "Alex set a table for their fifth anniversary. Jordan worked until nine; layoffs were announced that morning.",
        people = "Alex" to "Jordan",
        raw = "Jordan blew off our anniversary. Their job will always come before me." to
            "Alex is throwing a tantrum. Thirty percent of my division is gone and we have a mortgage.",
        heard = "Alex, sitting alone at a decorated table on a milestone is its own kind of loneliness. Of course it hurt.",
        misread = "An empty chair reads as \"you don't matter.\" It may have been panic, not indifference.",
        contrast = "Alex measures love in protected time. Jordan measures it in keeping the roof up.",
        commonGround = "You are both defending the same house, from two different doors.",
        question = "Alex, if Jordan could show you that you come first, what would that look like?",
        bridge = "Jordan, Alex isn't angry at your career. Alex misses you so much that an empty chair felt like being left.",
    ),
    Walkthrough(
        title = "The invisible load",
        context = "Morgan runs the calendar, the laundry, the meals. Sam feels anything they do gets redone.",
        people = "Morgan" to "Sam",
        raw = "I ask four times to get the trash taken out. I'm parenting my own spouse." to
            "Nothing is good enough. I cleaned the garage for four hours and got a glare at the sink.",
        heard = "Morgan, carrying the whole household in your head leaves nothing left over. You want relief.",
        misread = "Delay looks like expectation. It may be someone frozen by the fear of getting it wrong again.",
        contrast = "Morgan experiences clutter as loneliness. Sam experiences reminders as a test they'll fail.",
        commonGround = "Neither of you wants a parent and a child. You both want two adults at peace in one home.",
        question = "Morgan, which single task, owned start to finish, would give you the most air?",
        bridge = "Sam, Morgan isn't asking for perfect. Morgan is drowning and wants a teammate.",
    ),
    Walkthrough(
        title = "The holiday",
        context = "Taylor promised a long visit home for Thanksgiving. Riley is recovering from burnout.",
        people = "Riley" to "Taylor",
        raw = "Taylor made plans with their mother behind my back. My health means nothing." to
            "My father is 78 and failing. This could be the last one, and Riley is being cold.",
        heard = "Riley, being committed without being asked, while running on empty, is frightening.",
        misread = "It feels like being ranked below the in-laws. It may be grief arriving early.",
        contrast = "Riley needs quiet to heal. Taylor needs time with a parent who is running out of it.",
        commonGround = "You both care about family. You're guarding different parts of it.",
        question = "Riley, is there a shorter shape for the visit that would leave you whole?",
        bridge = "Taylor, Riley isn't keeping you from your dad. Riley needs a way to come without breaking.",
    ),
)
