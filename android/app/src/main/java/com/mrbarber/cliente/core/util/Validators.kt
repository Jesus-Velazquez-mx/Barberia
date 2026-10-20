package com.mrbarber.cliente.core.util

object Validators {
    private val EMAIL_REGEX = Regex("""^[^@\s]+@[^@\s]+\.[^@\s]+$""")

    fun isValidEmail(value: String): Boolean = EMAIL_REGEX.matches(value)
}
