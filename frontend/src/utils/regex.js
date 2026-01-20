/**
 * Common Regular Expressions shared across the application
 */

// Matches common CJK character ranges (Common + Extension A)
export const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/;

// Matches Vietnamese characters including all diacritics
export const VI_REGEX = /[\u00C0-\u00C3\u00C8-\u00CA\u00CC-\u00CD\u00D2-\u00D5\u00D9-\u00DA\u00DD\u00E0-\u00E3\u00E8-\u00EA\u00EC-\u00ED\u00F2-\u00F5\u00F9-\u00FA\u00FD\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0\u1EA0-\u1EF9]/i;

// Matches email structure (Simple)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
