<script lang="ts">
    import { allSettings, currentScreen } from "../../stores/settingsStore";
    import { apiBaseUrl } from "../../stores/apiStore";
    import { routeParams } from "../../stores/routeStore";
    import { onMount } from "svelte";
    import * as signalR from "@microsoft/signalr";

    let connection: signalR.HubConnection;
    let updatingSettingsFromServer = false;
    let initialSubscribeHandled = false;

    onMount(() => {
        apiBaseUrl.subscribe((serverUrl) => {
            connection = new signalR.HubConnectionBuilder()
                .withUrl(`${serverUrl}/notificationHub`)
                .withAutomaticReconnect()
                .build();

            connection
                .start()
                .then(() => {
                    connection
                        .invoke("RegisterUser", $routeParams.userId)
                        .catch((err) =>
                            console.error("Error sending user ID:", err),
                        );
                })
                .catch((err) => console.error(err));

            connection.on("UpdateSettings", (message: string) => {
                updatingSettingsFromServer = true;
                try {
                    //console.log("Applying settings from server:", message);
                    const newSettings = JSON.parse(message);
                    
                    // Check if current screen exists in server settings
                    const currentScreenId = $currentScreen;
                    if (!newSettings.screens[currentScreenId]) {
                        // Add current screen to settings (empty object)
                        newSettings.screens[currentScreenId] = {};
                        updatingSettingsFromServer = false; // we want to update the server settings with the new screen
                    }
                    
                    allSettings.set(newSettings);
                } catch (error) {
                    console.error(
                        "Error updating settings from server:",
                        error,
                    );
                }
                updatingSettingsFromServer = false;
            });
        });

        allSettings.subscribe((value) => {
            if (!initialSubscribeHandled) {
                initialSubscribeHandled = true;
                return; // Skip the initial subscribe callback
            }
            
            if (
                !updatingSettingsFromServer &&
                connection &&
                connection.state === signalR.HubConnectionState.Connected
            ) {
                //console.log("Updating settings from client:", value);
                // Extract timestamp from settings, fallback to very old date if missing
                const clientTimestamp = value.lastModified || "1970-01-01T00:00:00.000Z";
                connection.invoke(
                    "UpdateSettings",
                    $routeParams.userId,
                    JSON.stringify(value),
                    clientTimestamp
                );
            }
        });
    });
</script>
