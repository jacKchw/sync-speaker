import { Image } from "expo-image";
import { Button, StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { useAudioPlayer } from "expo-audio";
import { Directory, File, Paths } from "expo-file-system/next";
import { useRef, useState } from "react";

import DateTimePicker from "@react-native-community/datetimepicker";

const getDir = () => {
  const destination = new Directory(Paths.document, "audios");
  if (!destination.exists) {
    destination.create();
  }
  return destination;
};

const Player = ({ fileName }: { fileName: string }) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [playDate, setPlayDate] = useState<Date>(new Date());
  const [untilTime, setUntilTime] = useState<number>();
  const clockIntervalRef = useRef<number>(null);
  const clockTimeoutRef = useRef<number>(null);

  const onChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (!selectedDate) return;
    const currentDate = selectedDate;
    if (currentDate.getTime() - Date.now() < 0) {
      return;
    }
    setPlayDate(currentDate);
  };

  const direactory = getDir();
  const file = new File(direactory, fileName);
  const player = useAudioPlayer(file);

  const updateCurrentDate = () => {
    const currentTime = Date.now();
    const diff = playDate.getTime() - currentTime;
    if (diff < 0) return;
    if (diff < 10000 && clockTimeoutRef.current == null) {
      clockTimeoutRef.current = setTimeout(playAudio, diff);
    }
    setUntilTime(diff);
  };

  const clearClock = () => {
    if (clockIntervalRef.current) {
      clearInterval(clockIntervalRef.current);
    }
  };

  const startCountDown = async () => {
    if (clockIntervalRef.current) {
      clearInterval(clockIntervalRef.current);
    }

    if (playDate.getTime() - Date.now() < 0) {
      return;
    }

    clockIntervalRef.current = setInterval(updateCurrentDate, 1000);
    await player.seekTo(0);
  };

  const playAudio = async () => {
    player.play();

    if (clockIntervalRef.current) {
      clearInterval(clockIntervalRef.current);
    }
    if (clockTimeoutRef.current) {
      clearTimeout(clockTimeoutRef.current);
    }
  };

  return (
    <ThemedView>
      <Button onPress={() => setShowTimePicker(true)} title="Start At" />

      {showTimePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={playDate}
          mode="time"
          is24Hour={true}
          onChange={onChange}
        />
      )}

      <Button onPress={startCountDown} title="Play"></Button>
      {clockIntervalRef.current && (
        <Button onPress={clearClock} title="Reset"></Button>
      )}
      {untilTime && (
        <ThemedView>
          <ThemedText>Start in</ThemedText>
          <ThemedText>{Math.floor(untilTime / 1000 / 60)}m</ThemedText>
          <ThemedText>{Math.floor((untilTime / 1000) % 60)}s</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
};

const fileName = "001.m4a";

export default function HomeScreen() {
  const [downloadStatus, setDownloadStatus] = useState<
    undefined | "loading" | "success"
  >(undefined);
  const [isExist, setIsExist] = useState(() => {
    const directory = getDir();
    const file = new File(directory, fileName);
    return file.exists;
  });
  const download = async () => {
    setDownloadStatus("loading");
    const url = `${process.env.EXPO_PUBLIC_API_URL}/${fileName}`;

    const destination = getDir();
    const output = await File.downloadFileAsync(url, destination);
    setDownloadStatus("success");
    setIsExist(true);
  };

  const deleteFile = () => {
    if (!isExist) return;
    const directory = getDir();
    const file = new File(directory, fileName);
    file.delete();
    setIsExist(false);
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
        disabled={downloadStatus != undefined || isExist}
      />

      <Button onPress={deleteFile} title="Delete" disabled={!isExist} />
      {isExist && <Player fileName={fileName} />}

      <ThemedView style={styles.titleContainer}>
        <ThemedText>
          {downloadStatus == "loading"
            ? "Downloading"
            : downloadStatus == "success"
            ? "Download Successful"
            : ""}
        </ThemedText>
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
