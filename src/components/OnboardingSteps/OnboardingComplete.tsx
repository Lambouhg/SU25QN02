"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react"

interface OnboardingCompleteProps {
  onContinue: () => void
}

const OnboardingComplete: React.FC<OnboardingCompleteProps> = ({ onContinue }) => {
  const [countdown, setCountdown] = useState(3)
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    const timer = setInterval(() => {
      if (isMountedRef.current) {
        setCountdown((prev) => {
          if (prev <= 1) {
            setTimeout(() => {
              if (isMountedRef.current) {
                onContinue()
              }
            }, 0)
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => {
      isMountedRef.current = false
      clearInterval(timer)
    }
  }, [onContinue])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl text-center bg-white border border-gray-200 shadow-xl rounded-2xl">
        <CardHeader className="pt-8 pb-2">
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-9 h-9 text-white" />
            </div>
          </div>

          <CardTitle className="text-3xl font-extrabold tracking-tight text-gray-900">
            Setup completed!
          </CardTitle>
          <p className="text-gray-600 mt-3 text-base leading-relaxed max-w-xl mx-auto">
            Your profile is ready. We tailored your experience based on your selections.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              "Profile information updated",
              "Preferred role selected",
              "Skills saved successfully"
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="mt-0.5">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-800 leading-6">{text}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <hr className="border-t border-gray-200 mb-4" />
            <Button
              onClick={onContinue}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-700 hover:to-violet-600 text-white font-semibold shadow-md rounded-xl"
            >
              Go to dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-500">
            <span className="text-xs">Redirecting in {countdown} seconds…</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OnboardingComplete
