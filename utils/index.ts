import { saveToLibraryAsync } from 'expo-media-library'
import { getAllCellInfo } from '@/modules/cellinfo'
import { CameraView } from 'expo-camera'
import { publicClient } from '../clients/public'
import fs from 'fs'
import path from 'path'
import * as Location from 'expo-location'
import abi from '../abi/counterpoint.json'
import {
  decodeResult,
  FulfillmentCode,
  ResponseListener,
  ReturnType,
  SecretsManager,
  simulateScript,
  SubscriptionManager,
  DecodedResult
} from '@chainlink/functions-toolkit'
import { Contract, ethers, utils } from 'ethers'
const routerAddress = '0xC22a79eBA640940ABB6dF0f7982cc119578E11De'
const linkTokenAddress = '0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904'
const donId = 'fun-polygon-amoy-1'
const explorerUrl = 'https://www.oklink.com/amoy '
const gatewayUrls = [
  'https://01.functions-gateway.testnet.chain.link/',
  'https://02.functions-gateway.testnet.chain.link/'
]
const source = fs
  .readFileSync(path.resolve(__dirname, '../source.js'))
  .toString()
const subscriptionId = 239
const contractAddress = '0x91D3d0CE31ceA77F383821eF77A131356bc5F7a5'
const slotIdNumber = 0 // slot ID where to upload the secrets
const expirationTimeMinutes = 15 // expiration time in minutes of the secrets
const gasLimit = 300000

const handleTakePicture = async (
  camera: CameraView,
  walletClient: any,
  address: any,
  walletProvider: any
) => {
  const pic = await camera.takePictureAsync({
    exif: true
  })
  if (pic?.base64) {
    await saveToLibraryAsync(pic.uri)
    const stats = fs.statSync(pic.base64)
    const fileSizeInBytes = stats.size
    console.log('exif', pic.exif)
    const metadata = {
      gpsLongitude: pic.exif.gpsLongitude,
      gpsLatitude: pic.exif.gpsLatitude,
      gpsLongitudeRef: pic.exif.gpsLongitudeRef,
      gpsLatitudeRef: pic.exif.gpsLatitudeRef,
      timestamp: Date.parse(pic.exif.dateTimeOriginal),
      size: fileSizeInBytes,
      type: path.extname(pic.uri)
    }
    const data = await getAllCellInfo()
    const cellinfo = data[0]
    console.log('Cell Info:', data)
    const mapsRequest = {
      homeMobileCountryCode: cellinfo.mcc,
      homeMobileNetworkCode: cellinfo.mnc,
      radioType: cellinfo.type,
      cellTowers: [
        {
          cellId: cellinfo.ci,
          locationAreaCode: cellinfo.lac,
          mobileCountryCode: cellinfo.mcc,
          mobileNetworkCode: cellinfo.mnc,
          signalStrength: cellinfo.signalStrength
        }
      ]
    }
    const exifCoordinates = {
      lat:
        pic.exif.gpsLatitideRef === 'S'
          ? pic.exif.gpsLatitude * -1
          : pic.exif.gpsLatitude,
      lng:
        pic.exif.gpsLongitudeRef === 'W'
          ? pic.exif.gpsLongitude * -1
          : pic.exif.gpsLongitude
    }
    const location = await Location.getCurrentPositionAsync()
    const gpsCoordinates = {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    }
    const args = [
      JSON.stringify(mapsRequest),
      JSON.stringify(gpsCoordinates),
      JSON.stringify(exifCoordinates)
    ]
    const provider = new ethers.providers.Web3Provider(walletProvider)
    const signer = provider.getSigner()
    if (!signer) throw new Error(`failed to initailize signer`)
    const counterpoint = new Contract(contractAddress, abi, signer)
    const secretsManager = new SecretsManager({
      signer: signer,
      functionsRouterAddress: routerAddress,
      donId: donId
    })
    await secretsManager.initialize()

    // Encrypt secrets and upload to DON
    if (!process.env.EXPO_PUBLIC_MAPS_API)
      throw new Error(`api key  - check your environment variables`)
    const secrets = { MAPS_API: process.env.EXPO_PUBLIC_MAPS_API }

    const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets)

    console.log(
      `Upload encrypted secret to gateways ${gatewayUrls}. slotId ${slotIdNumber}. Expiration in minutes: ${expirationTimeMinutes}`
    )
    // Upload secrets
    const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
      encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
      gatewayUrls: gatewayUrls,
      slotId: slotIdNumber,
      minutesUntilExpiration: expirationTimeMinutes
    })

    if (!uploadResult.success)
      throw new Error(`Encrypted secrets not uploaded to ${gatewayUrls}`)
    console.log(
      `\n✅ Secrets uploaded properly to gateways ${gatewayUrls}! Gateways response: `,
      uploadResult
    )

    const donHostedSecretsVersion = uploadResult.version

    const transaction = await counterpoint.sendRequest(
      source,
      '0x',
      slotIdNumber,
      donHostedSecretsVersion,
      args,
      [],
      subscriptionId,
      gasLimit,
      utils.formatBytes32String(donId)
    )
    // Log transaction details
    console.log(
      `\n✅ Functions request sent! Transaction hash ${transaction.hash}. Waiting for a response...`
    )

    console.log(
      `See your request in the explorer ${explorerUrl}/tx/${transaction.hash}`
    )
    const responseListener = new ResponseListener({
      provider: provider,
      functionsRouterAddress: routerAddress
    }) // Instantiate a ResponseListener object to wait for fulfillment.
    try {
      const response: any = await new Promise((resolve, reject) => {
        responseListener
          .listenForResponseFromTransaction(transaction.hash)
          .then(async (response) => {
            resolve(response) // Resolves once the request has been fulfilled.
            if (
              decodeResult(
                response.responseBytesHexstring,
                ReturnType.uint256
              ) === BigInt(0)
            ) {
              await counterpoint.saveHash(
                metadata,
                pic.base64,
                response.requestId,
                {
                  value: 1
                }
              )
            }
          })
          .catch((error) => {
            reject(error) // Indicate that an error occurred while waiting for fulfillment.
          })
      })
    } catch (error) {
      console.error('Error listening for response:', error)
    }
  }
}
