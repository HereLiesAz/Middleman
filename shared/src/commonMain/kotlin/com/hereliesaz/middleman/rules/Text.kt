package com.hereliesaz.middleman.rules

/** "A", "A and B", "A, B and C". */
fun List<String>.joinedNaturally(): String = when (size) {
    0 -> ""
    1 -> first()
    else -> dropLast(1).joinToString(", ") + " and " + last()
}
