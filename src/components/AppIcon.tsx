import React from "react";
import { type StyleProp, Text, type TextStyle, type ViewStyle } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Polyline, Rect } from "react-native-svg";

type AppIconProps = {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<ViewStyle | TextStyle>;
    accessibilityLabel?: string;
    accessible?: boolean;
    testID?: string;
};

type IconRendererProps = {
    color: string;
    strokeWidth: number;
};

type IconRenderer = (props: IconRendererProps) => React.ReactNode;

const DEFAULT_COLOR = "#111827";
const DEFAULT_SIZE = 24;

const FALLBACK_SYMBOLS: Record<string, string> = {
    "arrow-forward-circle": ">",
    "arrow-upward": "^",
    book: "B",
    "book-outline": "B",
    "check-circle-outline": "v",
    checkmark: "v",
    "checkmark-circle": "v",
    "chevron-back": "<",
    "chevron-up-outline": "^",
    "close-circle": "x",
    "close-circle-outline": "x",
    "delete-outline": "x",
    "ellipse-outline": "o",
    "eye-off-outline": "-",
    "eye-outline": "o",
    history: "H",
    home: "H",
    "navigate-next": ">",
    "playlist-add": "+",
    "refresh-outline": "R",
    search: "S",
    "search-outline": "S",
    settings: "G",
    "sparkles-outline": "*",
    star: "*",
    "star-outline": "*",
    "time-outline": "o",
    visibility: "V",
    "visibility-off": "-",
    warning: "!",
    "volume-high-outline": ")",
    "volume-up": ")",
};

const ICONS: Record<string, IconRenderer> = {
    "arrow-forward-circle": ({ color, strokeWidth }) => (
        <>
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth={strokeWidth} />
            <Polyline points="12.5 9.5 15 12 12.5 14.5" fill="none" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    "arrow-upward": ({ color, strokeWidth }) => (
        <>
            <Line x1="12" y1="18" x2="12" y2="7" stroke={color} strokeWidth={strokeWidth} />
            <Polyline points="8.5 10.5 12 7 15.5 10.5" fill="none" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    book: ({ color, strokeWidth }) => (
        <>
            <Path
                d="M6.5 5.5h11a1 1 0 0 1 1 1v12h-11A3.5 3.5 0 0 0 4 22V8a2.5 2.5 0 0 1 2.5-2.5Z"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
            />
            <Line x1="7.5" y1="5.5" x2="7.5" y2="18.5" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    "book-outline": ({ color, strokeWidth }) => ICONS.book({ color, strokeWidth }),
    "check-circle-outline": ({ color, strokeWidth }) => (
        <>
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Polyline points="8 12.5 10.5 15 16 9.5" fill="none" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    checkmark: ({ color, strokeWidth }) => (
        <Polyline points="6.5 12.5 10 16 17.5 8.5" fill="none" stroke={color} strokeWidth={strokeWidth} />
    ),
    "checkmark-circle": ({ color, strokeWidth }) => (
        <>
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Polyline points="8 12.5 10.5 15 16 9.5" fill="none" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    "chevron-back": ({ color, strokeWidth }) => (
        <Polyline points="14.5 6 8.5 12 14.5 18" fill="none" stroke={color} strokeWidth={strokeWidth} />
    ),
    "chevron-up-outline": ({ color, strokeWidth }) => (
        <Polyline points="6 14.5 12 8.5 18 14.5" fill="none" stroke={color} strokeWidth={strokeWidth} />
    ),
    "close-circle": ({ color, strokeWidth }) => (
        <>
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Line x1="9" y1="9" x2="15" y2="15" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="15" y1="9" x2="9" y2="15" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    "close-circle-outline": ({ color, strokeWidth }) => ICONS["close-circle"]({ color, strokeWidth }),
    "delete-outline": ({ color, strokeWidth }) => (
        <>
            <Polyline points="8 7 8.8 5.5 15.2 5.5 16 7" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <Rect x="7.5" y="7" width="9" height="11.5" rx="1.5" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="10.5" y1="10" x2="10.5" y2="16" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="13.5" y1="10" x2="13.5" y2="16" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    "ellipse-outline": ({ color, strokeWidth }) => (
        <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
    ),
    "eye-off-outline": ({ color, strokeWidth }) => (
        <>
            {ICONS["eye-outline"]({ color, strokeWidth })}
            <Line x1="5" y1="19" x2="19" y2="5" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    "eye-outline": ({ color, strokeWidth }) => (
        <>
            <Path
                d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
            />
            <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
        </>
    ),
    history: ({ color, strokeWidth }) => (
        <>
            <Path d="M5.5 9A7.5 7.5 0 1 1 8 17.5" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <Polyline points="5.5 5.5 5.5 9.5 9.5 9.5" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="12" y1="9" x2="12" y2="12.5" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="12" y1="12.5" x2="14.5" y2="14" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    home: ({ color, strokeWidth }) => (
        <>
            <Path
                d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1v-7.5Z"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
            />
        </>
    ),
    "navigate-next": ({ color, strokeWidth }) => (
        <Polyline points="9.5 6 15.5 12 9.5 18" fill="none" stroke={color} strokeWidth={strokeWidth} />
    ),
    "playlist-add": ({ color, strokeWidth }) => (
        <>
            <Line x1="5" y1="8" x2="13" y2="8" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="5" y1="12" x2="13" y2="12" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="5" y1="16" x2="11" y2="16" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="17" y1="10" x2="17" y2="18" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="13" y1="14" x2="21" y2="14" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    "refresh-outline": ({ color, strokeWidth }) => (
        <>
            <Path d="M18.5 8.5A7 7 0 0 0 6.8 7.2" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <Polyline points="6.5 3.8 6.5 7.5 10.2 7.5" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M5.5 15.5A7 7 0 0 0 17.2 16.8" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <Polyline points="17.5 20.2 17.5 16.5 13.8 16.5" fill="none" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    search: ({ color, strokeWidth }) => (
        <>
            <Circle cx="11" cy="11" r="5.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Line x1="15.2" y1="15.2" x2="19" y2="19" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    "search-outline": ({ color, strokeWidth }) => ICONS.search({ color, strokeWidth }),
    settings: ({ color, strokeWidth }) => (
        <>
            <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Circle cx="12" cy="12" r="7" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Line x1="12" y1="2.5" x2="12" y2="5" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="12" y1="19" x2="12" y2="21.5" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="2.5" y1="12" x2="5" y2="12" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="19" y1="12" x2="21.5" y2="12" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="5.3" y1="5.3" x2="7.1" y2="7.1" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="16.9" y1="16.9" x2="18.7" y2="18.7" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="16.9" y1="7.1" x2="18.7" y2="5.3" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="5.3" y1="18.7" x2="7.1" y2="16.9" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    "sparkles-outline": ({ color, strokeWidth }) => (
        <>
            <Path
                d="M12 3.5 13.6 8.4 18.5 10 13.6 11.6 12 16.5 10.4 11.6 5.5 10 10.4 8.4Z"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
            />
            <Path
                d="M18.2 3.8 18.9 5.8 20.9 6.5 18.9 7.2 18.2 9.2 17.5 7.2 15.5 6.5 17.5 5.8Z"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
            />
            <Path
                d="M6 15.2 6.8 17.4 9 18.2 6.8 19 6 21.2 5.2 19 3 18.2 5.2 17.4Z"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
            />
        </>
    ),
    star: ({ color, strokeWidth }) => (
        <Path
            d="M12 4.5 14.2 9 19 9.6 15.5 12.9 16.4 17.5 12 15.1 7.6 17.5 8.5 12.9 5 9.6 9.8 9Z"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
        />
    ),
    "star-outline": ({ color, strokeWidth }) => ICONS.star({ color, strokeWidth }),
    "time-outline": ({ color, strokeWidth }) => (
        <>
            <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Line x1="12" y1="8" x2="12" y2="12.5" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="12" y1="12.5" x2="15.5" y2="14.5" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    visibility: ({ color, strokeWidth }) => ICONS["eye-outline"]({ color, strokeWidth }),
    "visibility-off": ({ color, strokeWidth }) => ICONS["eye-off-outline"]({ color, strokeWidth }),
    warning: ({ color, strokeWidth }) => (
        <>
            <Path d="M12 4.5 20 19H4Z" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth={strokeWidth} />
            <Circle cx="12" cy="16" r="0.8" fill={color} />
        </>
    ),
    "volume-high-outline": ({ color, strokeWidth }) => (
        <>
            <Path d="M5 10h3.5L12 7v10l-3.5-3H5Z" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M15 9.5a4 4 0 0 1 0 5" fill="none" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M17 7.5a7 7 0 0 1 0 9" fill="none" stroke={color} strokeWidth={strokeWidth} />
        </>
    ),
    "volume-up": ({ color, strokeWidth }) => ICONS["volume-high-outline"]({ color, strokeWidth }),
};

function getFallbackSymbol(name: string) {
    return FALLBACK_SYMBOLS[name] ?? "?";
}

function renderFallbackIcon({ accessible, accessibilityLabel, color, name, size, style, testID }: AppIconProps) {
    return (
        <Text
            style={[
                {
                    minWidth: size,
                    fontSize: size,
                    lineHeight: Math.round(size * 1.1),
                    fontWeight: "700",
                    color,
                    textAlign: "center",
                },
                style,
            ]}
            accessibilityRole="image"
            accessibilityLabel={accessibilityLabel}
            accessible={accessible}
            allowFontScaling={false}
            testID={testID}
        >
            {getFallbackSymbol(name)}
        </Text>
    );
}

function createIconComponent(displayName: string) {
    function AppIcon({
        name,
        size = DEFAULT_SIZE,
        color = DEFAULT_COLOR,
        style,
        accessibilityLabel,
        accessible,
        testID,
    }: AppIconProps) {
        const renderer = ICONS[name];
        if (!renderer) {
            return renderFallbackIcon({
                accessible,
                accessibilityLabel,
                color,
                name,
                size,
                style,
                testID,
            });
        }

        const strokeWidth = Math.max(1.75, Math.round((size / 24) * 2 * 10) / 10);

        return (
            <Svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                style={style}
                accessibilityRole="image"
                accessibilityLabel={accessibilityLabel}
                accessible={accessible}
                testID={testID}
            >
                {renderer({ color, strokeWidth })}
            </Svg>
        );
    }

    AppIcon.displayName = displayName;
    return AppIcon;
}

export const Ionicons = createIconComponent("Ionicons");
export const MaterialIcons = createIconComponent("MaterialIcons");
