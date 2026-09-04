import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/oauth/wearable/$provider")({
  head: () => ({
    meta: [
      { title: "Finishing your device connection — Terra Woman" },
      {
        name: "description",
        content: "Completing the secure device connection for your Terra Woman account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WearableReturn,
});

function WearableReturn() {
  const { provider } = Route.useParams();
  const [message, setMessage] = useState("Finishing your connection…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (type: "wearableOAuthComplete" | "wearableOAuthFailed") => {
      window.opener?.postMessage(
        {
          type,
          provider,
          code: params.get("code"),
          state: params.get("state"),
        },
        window.location.origin,
      );
      window.close();
    };

    const error = params.get("error");
    if (error || !params.get("code") || !params.get("state")) {
      setMessage(params.get("error_description") ?? error ?? "The connection did not complete.");
      notify("wearableOAuthFailed");
      return;
    }
    notify("wearableOAuthComplete");
  }, [provider]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
