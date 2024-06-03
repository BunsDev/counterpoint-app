import '@walletconnect/react-native-compat'
import '@ethersproject/shims'

import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalProvider,
  Web3Modal
} from '@web3modal/ethers5-react-native'
import {
  Image,
  StyleSheet,
  Platform,
  View,
  Button,
  Text,
  PermissionsAndroid,
  TouchableOpacity
} from 'react-native'

import { HelloWave } from '@/components/HelloWave'
import ParallaxScrollView from '@/components/ParallaxScrollView'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { hello, getAllCellInfo } from '../../modules/cellinfo'
import { useWalletConnectModal } from '@walletconnect/modal-react-native'
import { Address, createWalletClient, custom } from 'viem'
import { useMemo, useRef, useState } from 'react'
import { polygonAmoy } from 'viem/chains'
import { Camera, CameraView, useCameraPermissions } from 'expo-camera'
import * as MediaLibrary from 'expo-media-library'
import * as Location from 'expo-location'
import * as FileSystem from 'expo-file-system'
// @ts-ignore
import piexif from 'piexifjs'
import { CameraType } from 'expo-camera/build/legacy/Camera.types'
import { ethers } from 'ethers'

export default function HomeScreen() {
  // 1. Get projectId at https://cloud.walletconnect.com
  const projectId = '0455d5f533d3cdcb3e64bffc25f60cf4'

  // 2. Create config
  const metadata = {
    name: 'Web3Modal RN',
    description: 'Web3Modal RN Example',
    url: 'https://web3modal.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
    redirect: {
      native: 'YOUR_APP_SCHEME://'
    }
  }

  const config = defaultConfig({
    metadata,
    extraConnectors: []
  })

  // 3. Define your chains

  const polygonAmoy = {
    chainId: 80002,
    name: 'Polygon Amoy Testnet',
    currency: 'MATIC',
    explorerUrl: 'https://amoy.polygonscan.com/',
    rpcUrl: 'https://rpc-amoy.polygon.technology/'
  }

  const chains = [polygonAmoy]

  // 4. Create modal
  createWeb3Modal({
    projectId,
    chains,
    config,
    enableAnalytics: true // Optional - defaults to your Cloud configuration
  })

  const { open, close } = useWeb3Modal()
  const { address, chainId, isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()

  const cameraRef = useRef<CameraView | null>(null)

  const [facing, setFacing] = useState(CameraType.back)
  const [cameraPermission, requestCameraPermisssion] = useCameraPermissions()
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions()
  const [locationPermisssion, requestLocationPermission] =
    Location.useForegroundPermissions()
  const [hasPermissions, setHasPermissions] = useState(false)
  const [cellInfoList, setCellInfo] = useState<any>()

  const requestPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
      ])
      await requestCameraPermisssion()
      await requestLocationPermission()
      await requestMediaPermission()
      if (
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        cameraPermission?.granted &&
        mediaPermission?.granted &&
        locationPermisssion?.granted
      ) {
        setHasPermissions(true)
        console.log('You can use the app')
      } else {
        console.log(' permission denied')
      }
    } catch (err) {
      console.warn(err)
    }
  }
  const handleTakePicture = async () => {
    const location = await Location.getCurrentPositionAsync()
    if (cameraRef.current) {
      const pic = await cameraRef.current.takePictureAsync({
        exif: true
      })
      if (pic && pic.exif && location) {
        const fileUri = pic.uri
        const fileContents = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64
        })

        // Decode the image data to manipulate EXIF
        const binaryData = atob(fileContents)
        const exifObj = piexif.load(binaryData)

        // Add GPS data to the EXIF
        exifObj['GPS'][piexif.GPSIFD.GPSLatitude] =
          piexif.GPSHelper.degToDmsRational(location.coords.latitude)
        exifObj['GPS'][piexif.GPSIFD.GPSLongitude] =
          piexif.GPSHelper.degToDmsRational(location.coords.longitude)
        exifObj['GPS'][piexif.GPSIFD.GPSLatitudeRef] =
          location.coords.latitude >= 0 ? 'N' : 'S'
        exifObj['GPS'][piexif.GPSIFD.GPSLongitudeRef] =
          location.coords.longitude >= 0 ? 'E' : 'W'

        const exifStr = piexif.dump(exifObj)
        const newBinaryData = piexif.insert(exifStr, binaryData)
        const newBase64Data = btoa(newBinaryData)

        // Save the modified image
        const newFileUri = `${
          FileSystem.documentDirectory
        }modified_${new Date().getTime()}.jpg`
        await FileSystem.writeAsStringAsync(newFileUri, newBase64Data, {
          encoding: FileSystem.EncodingType.Base64
        })

        await MediaLibrary.saveToLibraryAsync(newFileUri)
        console.log('Photo saved to library with GPS data:', newFileUri)
      }
    }
  }

  if (!hasPermissions) {
    // Camera permissions are not granted yet
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={{ textAlign: 'center' }}>
          We need your permission to use the camera and access location
        </ThemedText>
        <Button onPress={requestPermissions} title="grant permissions" />
      </ThemedView>
    )
  }

  const toggleCameraFacing = () => {
    setFacing((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    )
  }
  return (
    <ThemedView style={styles.container}>
      <Web3Modal />
      {isConnected && hasPermissions && (
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <ThemedView style={styles.buttonContainer}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleTakePicture}
              style={{
                width: 70,
                height: 70,
                bottom: 0,
                borderRadius: 50,
                backgroundColor: '#fff',
                alignSelf: 'flex-end'
              }}
            />
          </ThemedView>
        </CameraView>
      )}

      {!isConnected && (
        <ThemedView style={styles.container}>
          <Button title="Connect" onPress={() => open()} />
        </ThemedView>
      )}
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  container: {
    flex: 1,
    justifyContent: 'center'
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute'
  },
  block: {
    marginTop: 32
  },
  camera: {
    flex: 1
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',

    justifyContent: 'center'
  },
  button: {
    flex: 1
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  }
})
