import React from "react";
import {
  Button,
  Dimensions,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import socketIOClient from "socket.io-client";
const ENDPOINT = "http://127.0.0.1:3000";

const LOCATION_TASK_NAME = "background-location-task";
const socket = socketIOClient(ENDPOINT);

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.log(error);
    return;
  }
  if (data) {
    const { locations } = data;
    let lat = locations[0].coords.latitude;
    let long = locations[0].coords.longitude;
    console.log(lat, long, "hello world");
    socket.emit("location", { lat, long });
  }
});

const App = () => {
  const [region, setRegion] = React.useState(null);
  const [error, setError] = React.useState("");
  const [map, setMap] = React.useState(null);

  const _getLocationAsync = async () => {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      enableHighAccuracy: true,
      timeInterval: 1000,
      distanceInterval: 1,
    });
    let location = await Location.watchPositionAsync(
      {
        enableHighAccuracy: true,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (newLocation) => {
        let { coords } = newLocation;
        let region = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.045,
          longitudeDelta: 0.045,
        };
        setRegion(region);
        // animate to new region
        map?.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
          3000
        );
      },
      (error) => console.log(error)
    );
    return location;
  };

  const _askPermissionAsync = async () => {
    const { status1 } = await Location.requestForegroundPermissionsAsync();
    const { status2 } = await Location.requestBackgroundPermissionsAsync();
    if (status1 !== "granted" || status2 !== "granted") {
      _getLocationAsync();
    } else if (status1 == "denied" || status2 == "denied") {
      setError("Permission to access location was denied");
      // open app settings
      Linking.openSettings();
    }
  };

  React.useEffect(() => {
    _askPermissionAsync();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={region}
        showsCompass={true}
        showsUserLocation={true}
        rotateEnabled={true}
        // ref={(map) => {
        //   this.map = map;
        // }}
        style={styles.map}
        tintColor="purple"
        provider="google"
        ref={(map) => {
          setMap(map);
        }}
        // allow zoom in and out
        scrollEnabled={true}
        zoomControlEnabled={true}
        mapType="satellite"
        followsUserLocation={true}
      >
        {region && (
          <Marker
            coordinate={region}
            title="Employees 
        Location"
          />
        )}
      </MapView>
      {/* <Text>{error ? error : "Waiting for location..."}</Text> */}
      {error ? <Text>{error}</Text> : null}
      {error === "Locations services needed" ? (
        <Button
          onPress={_askPermissionAsync}
          title="Enable location services"
        ></Button>
      ) : null}
      {region !== null ? (
        <Text>
          Your employee joe is currently at {region?.latitude},{" "}
          {region?.longitude}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    // justifyContent: "center",
  },
  map: {
    width: Dimensions.get("window").width,
    height:
      Dimensions.get("window").height - Dimensions.get("window").height / 4,
  },
});

export default App;
