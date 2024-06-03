package expo.modules.cellinfo

import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import android.telephony.CellInfo
import android.telephony.CellInfoWcdma
import android.telephony.CellIdentityWcdma
import android.telephony.CellSignalStrengthWcdma
import android.telephony.CellInfoGsm
import android.telephony.CellIdentityGsm
import android.telephony.CellSignalStrengthGsm
import android.telephony.CellInfoLte
import android.telephony.CellIdentityLte
import android.telephony.CellSignalStrengthLte
import android.telephony.CellInfoCdma
import android.telephony.CellIdentityCdma
import android.telephony.CellSignalStrengthCdma
import android.telephony.CellInfoNr
import android.telephony.CellIdentityNr
import android.telephony.CellSignalStrengthNr
import android.telephony.CellInfoTdscdma
import android.telephony.CellIdentityTdscdma
import android.telephony.CellSignalStrengthTdscdma


object CellInfoConverter {

    
    fun convertCellInfoGsm(cellInfoGsm: CellInfoGsm): WritableMap {
        val cellInfoMap: WritableMap = Arguments.createMap()

        val cellIdentity: CellIdentityGsm = cellInfoGsm.cellIdentity
        val cellSignalStrength: CellSignalStrengthGsm = cellInfoGsm.cellSignalStrength

      
        cellInfoMap.putString("type", "GSM")
        cellInfoMap.putInt("cid", cellIdentity.getCid())
        cellInfoMap.putInt("lac", cellIdentity.getLac())
        cellInfoMap.putString("mcc", cellIdentity.getMccString())
        cellInfoMap.putString("mnc", cellIdentity.getMncString())
        cellInfoMap.putInt("signalStrength", cellSignalStrength.getDbm())
        cellInfoMap.putInt("asu", cellSignalStrength.getAsuLevel())
        
        return cellInfoMap
    }

    fun convertCellInfoCdma(cellInfoCdma: CellInfoCdma): WritableMap {
        val cellInfoMap: WritableMap = Arguments.createMap()

        val cellIdentity: CellIdentityCdma = cellInfoCdma.cellIdentity
        val cellSignalStrength: CellSignalStrengthCdma = cellInfoCdma.cellSignalStrength

        cellInfoMap.putString("type", "CDMA")
        cellInfoMap.putInt("bid", cellIdentity.getBasestationId())
        cellInfoMap.putInt("lon", cellIdentity.getLongitude())
        cellInfoMap.putInt("lat", cellIdentity.getLatitude())
        cellInfoMap.putInt("nid", cellIdentity.getNetworkId())
        cellInfoMap.putInt("sid", cellIdentity.getSystemId())
        cellInfoMap.putInt("signalStrength", cellSignalStrength.getDbm())
        cellInfoMap.putInt("asu", cellSignalStrength.getAsuLevel())
        
        return cellInfoMap
    }

    fun convertCellInfoWcdma(cellInfoWcdma: CellInfoWcdma): WritableMap {
        val cellInfoMap: WritableMap = Arguments.createMap()

        val cellIdentity: CellIdentityWcdma = cellInfoWcdma.cellIdentity
        val cellSignalStrength: CellSignalStrengthWcdma = cellInfoWcdma.cellSignalStrength

        cellInfoMap.putString("type", "WCDMA")
        cellInfoMap.putInt("cid", cellIdentity.getCid())
        cellInfoMap.putInt("lac", cellIdentity.getLac())
        cellInfoMap.putString("mcc", cellIdentity.getMccString())
        cellInfoMap.putString("mnc", cellIdentity.getMncString())
        cellInfoMap.putInt("signalStrength", cellSignalStrength.getDbm())
        cellInfoMap.putInt("ber", cellSignalStrength.getAsuLevel())
        
        return cellInfoMap
      
    }
       
    fun convertCellInfoTdscdma(cellInfoTdscdma: CellInfoTdscdma): WritableMap {
        val cellInfoMap: WritableMap = Arguments.createMap()

        val cellIdentity: CellIdentityTdscdma = cellInfoTdscdma.cellIdentity
        val cellSignalStrength: CellSignalStrengthTdscdma = cellInfoTdscdma.cellSignalStrength

       
        cellInfoMap.putString("type", "TDSCDMA")
        cellInfoMap.putInt("cid", cellIdentity.getCid())
        cellInfoMap.putInt("lac", cellIdentity.getLac())
        cellInfoMap.putString("mcc", cellIdentity.getMccString())
        cellInfoMap.putString("mnc", cellIdentity.getMncString())
        cellInfoMap.putInt("signalStrength", cellSignalStrength.getDbm())
        cellInfoMap.putInt("ber", cellSignalStrength.getAsuLevel())
        
        return cellInfoMap
    }

    
    fun convertCellInfoLte(cellInfoLte: CellInfoLte): WritableMap {
        val cellInfoMap: WritableMap = Arguments.createMap()

        val cellIdentity: CellIdentityLte = cellInfoLte.cellIdentity 
        val cellSignalStrength: CellSignalStrengthLte = cellInfoLte.cellSignalStrength

       
        cellInfoMap.putString("type", "LTE")
        cellInfoMap.putInt("ci", cellIdentity.getCi())
        cellInfoMap.putString("mcc", cellIdentity.getMccString())
        cellInfoMap.putString("mnc", cellIdentity.getMncString())
        cellInfoMap.putInt("signalStrength", cellSignalStrength.getDbm())
        cellInfoMap.putInt("ber", cellSignalStrength.getAsuLevel())
        
        return cellInfoMap
    }



    
    fun convertCellInfoNr(cellInfoNr: CellInfoNr): WritableMap {
        val cellInfoMap: WritableMap = Arguments.createMap()

        val cellIdentity: CellIdentityNr = cellInfoNr.cellIdentity as CellIdentityNr
        val cellSignalStrength: CellSignalStrengthNr = cellInfoNr.cellSignalStrength as CellSignalStrengthNr

        cellInfoMap.putString("type", "NR")
        cellInfoMap.putInt("nci", cellIdentity.getNci().toInt())
        cellInfoMap.putString("mcc", cellIdentity.getMccString())
        cellInfoMap.putString("mnc", cellIdentity.getMncString())
        cellInfoMap.putInt("signalStrength", cellSignalStrength.getDbm())
        cellInfoMap.putInt("ber", cellSignalStrength.getAsuLevel())

        return cellInfoMap
    }

        


    fun createAllCellInfoArray(cellInfoList: List<CellInfo>): WritableArray {
        val cellInfoArray: WritableArray = Arguments.createArray()

           for (cellInfo in cellInfoList) {
            when (cellInfo) {
                is CellInfoGsm -> cellInfoArray.pushMap(convertCellInfoGsm(cellInfo))
                is CellInfoCdma -> cellInfoArray.pushMap(convertCellInfoCdma(cellInfo))
                is CellInfoWcdma -> cellInfoArray.pushMap(convertCellInfoWcdma(cellInfo))
                is CellInfoTdscdma -> cellInfoArray.pushMap(convertCellInfoTdscdma(cellInfo))
                is CellInfoLte -> cellInfoArray.pushMap(convertCellInfoLte(cellInfo))
                is CellInfoNr -> cellInfoArray.pushMap(convertCellInfoNr(cellInfo))
            }
        }
        return cellInfoArray
    }
}