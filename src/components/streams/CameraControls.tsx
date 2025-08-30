'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  AlertTriangle,
  Play,
  Square,
} from 'lucide-react'
import type { StreamStatus } from '@/types/streams'

interface CameraControlsProps {
  streamId: string
  currentStatus: StreamStatus
  onStatusChange: (newStatus: StreamStatus) => void
  className?: string
}

export default function CameraControls({
  streamId,
  currentStatus,
  onStatusChange,
  className = '',
}: CameraControlsProps) {
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [cameraWarning, setCameraWarning] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isTestingMic, setIsTestingMic] = useState(false)
  const [micTestVolume, setMicTestVolume] = useState(0)

  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const cameraCheckRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const micTestRef = useRef<MediaStream | null>(null)
  const micTestIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Camera availability check
  useEffect(() => {
    if (currentStatus === 'active') {
      checkCameraAvailability()
      startCameraMonitoring()
      startCameraStream()
    } else {
      stopCameraMonitoring()
      stopCameraStream()
    }

    return () => {
      stopCameraMonitoring()
      stopCameraStream()
    }
  }, [currentStatus])

  // Countdown timer for auto-stream-end
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null))
      }, 1000)
    } else if (countdown === 0) {
      handleAutoEndStream()
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current)
      }
    }
  }, [countdown])

  const startCameraStream = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraWarning(false)
      setCountdown(null)
    } catch (error) {
      console.error('Error starting camera stream:', error)
      setCameraWarning(true)
      startAutoEndCountdown()
    }
  }

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === 'videoinput')

      if (videoDevices.length === 0) {
        setCameraWarning(true)
        startAutoEndCountdown()
      } else {
        setCameraWarning(false)
        setCountdown(null)
      }
    } catch (error) {
      console.error('Error checking camera availability:', error)
      setCameraWarning(true)
      startAutoEndCountdown()
    }
  }

  const startCameraMonitoring = () => {
    cameraCheckRef.current = setInterval(checkCameraAvailability, 10000)
  }

  const stopCameraMonitoring = () => {
    if (cameraCheckRef.current) {
      clearInterval(cameraCheckRef.current)
    }
  }

  const startAutoEndCountdown = () => {
    setCountdown(180)
  }

  const handleAutoEndStream = async () => {
    try {
      await onStatusChange('ended')
      alert('Stream automatically ended due to camera unavailability')
    } catch (error) {
      console.error('Error auto-ending stream:', error)
    }
  }

  const toggleCamera = () => {
    if (isCameraOn) {
      setIsCameraOn(false)
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0]
        if (videoTrack) videoTrack.enabled = false
      }
    } else {
      setIsCameraOn(true)
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0]
        if (videoTrack) videoTrack.enabled = true
      }
    }
  }

  const toggleMicrophone = () => {
    if (isMicrophoneOn) {
      setIsMicrophoneOn(false)
      if (streamRef.current) {
        const audioTrack = streamRef.current.getAudioTracks()[0]
        if (audioTrack) audioTrack.enabled = false
      }
    } else {
      setIsMicrophoneOn(true)
      if (streamRef.current) {
        const audioTrack = streamRef.current.getAudioTracks()[0]
        if (audioTrack) audioTrack.enabled = true
      }
    }
  }

  const toggleScreenSharing = () => {
    setIsScreenSharing(!isScreenSharing)
  }

  const testMicrophone = async () => {
    if (isTestingMic) {
      setIsTestingMic(false)
      if (micTestRef.current) {
        micTestRef.current.getTracks().forEach((track) => track.stop())
        micTestRef.current = null
      }
      if (micTestIntervalRef.current) {
        clearInterval(micTestIntervalRef.current)
        micTestIntervalRef.current = null
      }
      setMicTestVolume(0)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micTestRef.current = stream
      setIsTestingMic(true)

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      micTestIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setMicTestVolume(average)
      }, 100)
    } catch (error) {
      console.error('Error testing microphone:', error)
      alert('Could not access microphone')
    }
  }

  const getCameraStatus = () => {
    if (cameraWarning) return 'Camera Unavailable'
    if (!isCameraOn) return 'Camera Disabled'
    return 'Camera Active'
  }

  const getMicrophoneStatus = () => {
    return isMicrophoneOn ? 'Microphone On' : 'Microphone Off'
  }

  if (currentStatus !== 'active') {
    return null
  }

  return (
    <>
      <div className={`bg-surface border border-border rounded-xl p-4 space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Stream Controls</h3>
        </div>

        {/* Camera Preview */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${!isCameraOn ? 'opacity-50' : ''}`}
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera Disabled</p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Warning */}
        {cameraWarning && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Camera Unavailable</span>
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Please connect a camera or enable camera access
            </p>
            {countdown !== null && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Stream will end automatically in {Math.floor(countdown / 60)}:
                {(countdown % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>
        )}

        {/* Main Camera and Microphone Controls */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={isCameraOn ? 'default' : 'outline'}
            size="lg"
            onClick={toggleCamera}
            className="flex items-center gap-2 h-12"
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            {isCameraOn ? 'Camera On' : 'Camera Off'}
          </Button>

          <Button
            variant={isMicrophoneOn ? 'default' : 'outline'}
            size="lg"
            onClick={toggleMicrophone}
            className="flex items-center gap-2 h-12"
          >
            {isMicrophoneOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            {isMicrophoneOn ? 'Mic On' : 'Mic Off'}
          </Button>
        </div>

        {/* Additional Controls */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={isScreenSharing ? 'default' : 'outline'}
            size="sm"
            onClick={toggleScreenSharing}
            className="flex items-center gap-2"
          >
            {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            {isScreenSharing ? 'Stop Share' : 'Share Screen'}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onStatusChange('ended')}
            className="flex items-center gap-2"
          >
            End Stream
          </Button>
        </div>

        {/* Microphone Test */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Microphone Test</h4>
            <Button
              variant={isTestingMic ? 'destructive' : 'outline'}
              size="sm"
              onClick={testMicrophone}
              className="flex items-center gap-2"
            >
              {isTestingMic ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isTestingMic ? 'Stop Test' : 'Test Mic'}
            </Button>
          </div>

          {isTestingMic && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${(micTestVolume / 255) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Volume: {Math.round((micTestVolume / 255) * 100)}%
              </p>
            </div>
          )}
        </div>

        {/* Status Display */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div
              className={`text-lg font-medium ${cameraWarning ? 'text-yellow-500' : isCameraOn ? 'text-green-500' : 'text-muted-foreground'}`}
            >
              {getCameraStatus()}
            </div>
          </div>
          <div className="text-center">
            <div
              className={`text-lg font-medium ${isMicrophoneOn ? 'text-green-500' : 'text-muted-foreground'}`}
            >
              {getMicrophoneStatus()}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-3 border-t border-border">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              Record
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Screenshot
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
