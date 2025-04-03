import { Toast } from "@jigra/toast";

export const showToast = async (
  text: string,
  duration?: "short" | "long",
  position?: "top" | "center" | "bottom"
) => {
  await Toast.show({
    text: text,
    duration: duration,
    position: position,
  });
};
