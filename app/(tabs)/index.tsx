import { Image } from "expo-image";
import { Button, StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { useAudioPlayer } from "expo-audio";
import { Directory, File, Paths } from "expo-file-system/next";
import { startTransition, useEffect, useRef, useState } from "react";

import DateTimePicker from "@react-native-community/datetimepicker";

const Player = ({
  audioFile,
  startAt,
}: {
  audioFile: File;
  startAt: number;
}) => {
  const player = useAudioPlayer(audioFile);
  const [untilTime, setUntilTime] = useState<number>(() => {
    return startAt - Date.now();
  });
  const clockIntervalRef = useRef<number>(null);
  const clockTimeoutRef = useRef<number>(null);

  const updateCurrentDate = () => {
    const currentTime = Date.now();
    const diff = startAt - currentTime;
    if (diff < 0) return;
    if (diff < 10000 && clockTimeoutRef.current == null) {
      clockTimeoutRef.current = setTimeout(playAudio, diff);
    }

    startTransition(() => {
      setUntilTime(diff);
    });
  };

  const cleanUp = () => {
    if (clockIntervalRef.current) {
      clearInterval(clockIntervalRef.current);
      clockIntervalRef.current = null;
    }
    if (clockTimeoutRef.current) {
      clearTimeout(clockTimeoutRef.current);
      clockTimeoutRef.current = null;
    }
  };

  const playAudio = () => {
    player.play();
    cleanUp();
  };

  useEffect(() => {
    player.seekTo(0);
    // set interval
    if (clockIntervalRef.current) {
      clearInterval(clockIntervalRef.current);
    }

    if (startAt - Date.now() < 0) {
      // todo: handle late start
      return;
    }

    clockIntervalRef.current = setInterval(updateCurrentDate, 1000);

    return () => {
      // clean up clock interval
      cleanUp();
    };
  }, []);

  return (
    <ThemedView>
      <ThemedText>Start in</ThemedText>
      <ThemedView
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 5,
          justifyContent: "center",
        }}
      >
        <ThemedText type="clock">
          {Math.floor(untilTime / 1000 / 60)}
        </ThemedText>
        <ThemedText>m</ThemedText>
        <ThemedText type="clock">
          {Math.floor((untilTime / 1000) % 60)
            .toString()
            .padStart(2, "0")}
        </ThemedText>
        <ThemedText>s</ThemedText>
      </ThemedView>
    </ThemedView>
  );
};

const TimePickerPlayer = ({ audioFile }: { audioFile: File }) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [startAtDate, setStartAtDate] = useState<Date>(new Date());
  const [showPlayer, setShowPlayer] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (!selectedDate) return;
    const currentDate = selectedDate;
    if (currentDate.getTime() - Date.now() < 0) {
      return;
    }
    setStartAtDate(currentDate);
    setShowPlayer(true);
  };

  return (
    <ThemedView>
      <Button onPress={() => setShowTimePicker(true)} title="select time" />

      {showTimePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={startAtDate}
          mode="time"
          is24Hour={true}
          onChange={onChange}
        />
      )}

      {showPlayer && (
        <ThemedView>
          <Player audioFile={audioFile} startAt={startAtDate.getTime()} />
          <Button
            onPress={() => {
              setShowPlayer(false);
            }}
            title="reset"
          />
        </ThemedView>
      )}
    </ThemedView>
  );
};

const getDir = () => {
  const destination = new Directory(Paths.document, "audios");
  if (!destination.exists) {
    destination.create();
  }
  return destination;
};

export default function HomeScreen() {
  const audioDirectory = getDir();
  const fileName = "001.m4a";
  const audioFile = new File(audioDirectory, fileName);

  const [downloadStatus, setDownloadStatus] = useState<
    undefined | "loading" | "downloaded"
  >(() => {
    if (audioFile.exists) return "downloaded";
  });

  const download = async () => {
    setDownloadStatus("loading");
    const url = `${process.env.EXPO_PUBLIC_API_URL}/${fileName}`;

    await File.downloadFileAsync(url, audioDirectory);
    setDownloadStatus("downloaded");
  };

  const deleteFile = () => {
    if (downloadStatus !== "downloaded") return;
    audioFile.delete();
    setDownloadStatus(undefined);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Speaker</ThemedText>
      </ThemedView>
      <Button
        onPress={download}
        title="Download"
        disabled={downloadStatus != undefined}
      />

      <Button
        onPress={deleteFile}
        title="Delete"
        disabled={downloadStatus != "downloaded"}
      />
      {downloadStatus == "downloaded" && (
        <TimePickerPlayer audioFile={audioFile} />
      )}

      <ThemedView style={styles.titleContainer}>
        <ThemedText>{downloadStatus == "loading" && "Downloading"}</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
