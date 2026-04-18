import type { ReactElement } from "react";

type IconTone = "brand" | "light" | "maskable";

const palette: Record<
  IconTone,
  {
    background: string;
    accent: string;
    block: string;
    radius: string;
    frameInset: string;
  }
> = {
  brand: {
    background: "#0D6F66",
    accent: "#F7F2EC",
    block: "#D87C36",
    radius: "22%",
    frameInset: "18%",
  },
  light: {
    background: "#F4EFE7",
    accent: "#0D6F66",
    block: "#D87C36",
    radius: "22%",
    frameInset: "18%",
  },
  maskable: {
    background: "#0D6F66",
    accent: "#F7F2EC",
    block: "#D87C36",
    radius: "18%",
    frameInset: "12%",
  },
};

export function renderPwaIcon(tone: IconTone): ReactElement {
  const colors = palette[tone];

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: colors.background,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          width: `calc(100% - ${colors.frameInset})`,
          height: `calc(100% - ${colors.frameInset})`,
          borderRadius: colors.radius,
          background: colors.background,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "12%",
            top: "16%",
            width: "76%",
            height: "11%",
            borderRadius: "999px",
            background: colors.accent,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "44%",
            top: "16%",
            width: "12%",
            height: "56%",
            borderRadius: "999px",
            background: colors.accent,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "20%",
            top: "62%",
            width: "60%",
            height: "22%",
            borderRadius: "22%",
            background: colors.block,
          }}
        />
      </div>
    </div>
  );
}
