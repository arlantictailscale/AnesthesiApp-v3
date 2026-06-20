import React, { useState, useEffect, useMemo } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import Slider from '@react-native-community/slider'
import { supabase } from './lib/supabase'

// Types
type BolusDrug = {
  name: string
  class: string
  defaultDose: number
  unit: 'mg/kg' | 'mcg/kg'
  minDose: number
  maxDose: number
  concentration: number
  concentrationUnit: 'mg/ml' | 'mcg/ml'
  clinicalTip: string
}

type InfusionDrug = {
  name: string
  class: string
  defaultDoseRate: number
  unit: 'mcg/kg/min' | 'mcg/kg/hr'
  minRate: number
  maxRate: number
  defaultSyringeAmount: number
  syringeAmountUnit: 'mg' | 'mcg'
  defaultSyringeVolume: number
  clinicalTip: string
}

type Profile = {
  full_name?: string
  role?: string
  supporter_tier?: string
}

// Data Definition
const BOLUS_DRUGS: BolusDrug[] = [
  {
    name: 'Propofol',
    class: 'Induction Agent',
    defaultDose: 2.0,
    unit: 'mg/kg',
    minDose: 1.5,
    maxDose: 2.5,
    concentration: 10,
    concentrationUnit: 'mg/ml',
    clinicalTip: 'Can cause significant vasodilation and hypotension. Reduce dose in elderly or compromised cardiac states.',
  },
  {
    name: 'Fentanyl',
    class: 'Opioid Analgesic',
    defaultDose: 2.0,
    unit: 'mcg/kg',
    minDose: 1.0,
    maxDose: 3.0,
    concentration: 50,
    concentrationUnit: 'mcg/ml',
    clinicalTip: 'Administer slowly to avoid chest wall rigidity. Synergistic with propofol and midazolam.',
  },
  {
    name: 'Succinylcholine',
    class: 'Depolarizing NMB',
    defaultDose: 1.5,
    unit: 'mg/kg',
    minDose: 1.0,
    maxDose: 2.0,
    concentration: 20,
    concentrationUnit: 'mg/ml',
    clinicalTip: 'Fast onset (30-60s), short duration (5-10m). Trigger for malignant hyperthermia. Contraindicated in hyperkalemic states.',
  },
  {
    name: 'Ketamine',
    class: 'Dissociative Anesthetic',
    defaultDose: 1.5,
    unit: 'mg/kg',
    minDose: 1.0,
    maxDose: 2.5,
    concentration: 50,
    concentrationUnit: 'mg/ml',
    clinicalTip: 'Maintains respiration and sympathetic tone. Good for hemodynamically unstable patients or bronchospasm.',
  },
  {
    name: 'Rocuronium',
    class: 'Non-depolarizing NMB',
    defaultDose: 1.0,
    unit: 'mg/kg',
    minDose: 0.6,
    maxDose: 1.2,
    concentration: 10,
    concentrationUnit: 'mg/ml',
    clinicalTip: 'Sugammadex (2-4 mg/kg) can be used for rapid reversal. Standard intubating dose is 0.6 - 1.2 mg/kg.',
  },
  {
    name: 'Midazolam',
    class: 'Benzodiazepine Sedative',
    defaultDose: 0.1,
    unit: 'mg/kg',
    minDose: 0.05,
    maxDose: 0.2,
    concentration: 1,
    concentrationUnit: 'mg/ml',
    clinicalTip: 'Antidote is flumazenil. Often used for pre-medication or pediatric oral/nasal sedation.',
  },
]

const INFUSION_DRUGS: InfusionDrug[] = [
  {
    name: 'Norepinephrine',
    class: 'Vasopressor',
    defaultDoseRate: 0.1,
    unit: 'mcg/kg/min',
    minRate: 0.01,
    maxRate: 0.5,
    defaultSyringeAmount: 4,
    syringeAmountUnit: 'mg',
    defaultSyringeVolume: 50,
    clinicalTip: 'First-line vasopressor for septic shock. Administer via central line if possible to avoid tissue extravasation.',
  },
  {
    name: 'Propofol (TIVA)',
    class: 'Anesthetic Infusion',
    defaultDoseRate: 100,
    unit: 'mcg/kg/min',
    minRate: 25,
    maxRate: 200,
    defaultSyringeAmount: 500,
    syringeAmountUnit: 'mg',
    defaultSyringeVolume: 50,
    clinicalTip: 'Used for Total Intravenous Anesthesia. Monitor for Propofol Infusion Syndrome (PRIS) in long-term ICU infusions.',
  },
  {
    name: 'Dexmedetomidine',
    class: 'Alpha-2 Agonist Sedative',
    defaultDoseRate: 0.4,
    unit: 'mcg/kg/hr',
    minRate: 0.2,
    maxRate: 1.0,
    defaultSyringeAmount: 200,
    syringeAmountUnit: 'mcg',
    defaultSyringeVolume: 50,
    clinicalTip: 'Provides cooperative sedation without respiratory depression. Side effects include bradycardia and hypotension.',
  },
]

export default function App() {
  // Auth state
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)

  // Auth inputs
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  // Main UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator'>('calculator')

  // Calculator state
  const [weight, setWeight] = useState(70)
  const [activeCalcTab, setActiveCalcTab] = useState<'bolus' | 'infusion'>('bolus')

  // Bolus calculator states
  const [selectedBolusIdx, setSelectedBolusIdx] = useState(0)
  const selectedBolus = BOLUS_DRUGS[selectedBolusIdx]
  const [customBolusDose, setCustomBolusDose] = useState(selectedBolus.defaultDose)

  // Reset custom dose when drug changes
  const handleBolusDrugChange = (idx: number) => {
    setSelectedBolusIdx(idx)
    setCustomBolusDose(BOLUS_DRUGS[idx].defaultDose)
  }

  // Infusion calculator states
  const [selectedInfIdx, setSelectedInfIdx] = useState(0)
  const selectedInf = INFUSION_DRUGS[selectedInfIdx]
  const [customRate, setCustomRate] = useState(selectedInf.defaultDoseRate)
  const [syringeAmount, setSyringeAmount] = useState(selectedInf.defaultSyringeAmount)
  const [syringeVolume, setSyringeVolume] = useState(selectedInf.defaultSyringeVolume)

  // Reset infusion inputs when drug changes
  const handleInfusionDrugChange = (idx: number) => {
    setSelectedInfIdx(idx)
    const drug = INFUSION_DRUGS[idx]
    setCustomRate(drug.defaultDoseRate)
    setSyringeAmount(drug.defaultSyringeAmount)
    setSyringeVolume(drug.defaultSyringeVolume)
  }

  // Weight presets handler
  const handleWeightPreset = (w: number) => {
    setWeight(w)
  }

  // Supabase Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role, supporter_tier')
        .eq('id', userId)
        .single()
      if (data) {
        setProfile(data)
      }
    } catch (e) {
      console.warn('Profile fetch error:', e)
    }
  }

  // Auth operations
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all credentials')
      return
    }
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      Alert.alert('Login Failed', error.message)
    }
    setAuthLoading(false)
  }

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all credentials')
      return
    }
    setAuthLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) {
      Alert.alert('Registration Failed', error.message)
    } else {
      Alert.alert('Success', 'Check your email inbox to verify your account!')
      setIsRegistering(false)
    }
    setAuthLoading(false)
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Logout Error', error.message)
    }
  }

  // Computations
  const bolusResults = useMemo(() => {
    const totalDose = weight * customBolusDose
    const totalDoseFormatted =
      selectedBolus.unit === 'mg/kg' ? `${totalDose.toFixed(1)} mg` : `${totalDose.toFixed(1)} mcg`

    const volume = totalDose / selectedBolus.concentration
    return {
      totalDoseFormatted,
      volume: volume.toFixed(2),
    }
  }, [weight, customBolusDose, selectedBolus])

  const infusionResults = useMemo(() => {
    let concentrationMcgMl = 0
    if (selectedInf.syringeAmountUnit === 'mg') {
      concentrationMcgMl = (syringeAmount * 1000) / syringeVolume
    } else {
      concentrationMcgMl = syringeAmount / syringeVolume
    }

    let flowRateMlHr = 0
    let stepBreakdown = ''

    if (selectedInf.unit === 'mcg/kg/min') {
      flowRateMlHr = (customRate * weight * 60) / concentrationMcgMl
      stepBreakdown = `1. Concentration = (${syringeAmount} mg × 1000) / ${syringeVolume} ml = ${concentrationMcgMl.toFixed(
        1
      )} mcg/ml\n2. Formula = (Rate × Weight × 60) / Concentration\n3. Calculation = (${customRate} × ${weight} kg × 60) / ${concentrationMcgMl.toFixed(
        1
      )}\n4. Result = ${flowRateMlHr.toFixed(2)} ml/hr`
    } else if (selectedInf.unit === 'mcg/kg/hr') {
      flowRateMlHr = (customRate * weight) / concentrationMcgMl
      stepBreakdown = `1. Concentration = (${syringeAmount} mcg) / ${syringeVolume} ml = ${concentrationMcgMl.toFixed(
        1
      )} mcg/ml\n2. Formula = (Rate × Weight) / Concentration\n3. Calculation = (${customRate} × ${weight} kg) / ${concentrationMcgMl.toFixed(
        1
      )}\n4. Result = ${flowRateMlHr.toFixed(2)} ml/hr`
    }

    return {
      concentration: concentrationMcgMl.toFixed(1),
      flowRate: flowRateMlHr.toFixed(2),
      stepBreakdown,
    }
  }, [weight, customRate, syringeAmount, syringeVolume, selectedInf])

  const isPediatric = weight < 30

  // Views
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E293B" />
        <Text style={styles.loadingText}>Initializing AnesthesiApp...</Text>
      </View>
    )
  }

  if (!session) {
    // Auth View
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.authHero}>
            <Text style={styles.brandTitle}>AnesthesiApp</Text>
            <Text style={styles.brandSubtitle}>Mobile Reference & Calculation Companion</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>{isRegistering ? 'Create Account' : 'Sign In'}</Text>

            {isRegistering && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                  placeholder="Dr. John Doe"
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholder="Min. 6 characters"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {authLoading ? (
              <ActivityIndicator size="small" color="#BE123C" style={{ marginVertical: 15 }} />
            ) : (
              <TouchableOpacity
                onPress={isRegistering ? handleSignUp : handleSignIn}
                style={[styles.button, { backgroundColor: '#1E293B' }]}
              >
                <Text style={styles.buttonText}>{isRegistering ? 'Register' : 'Login'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
              <Text style={styles.toggleText}>
                {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // App Main View
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.appHeader}>
        <Text style={styles.headerTitle}>AnesthesiApp</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.appContent}>
        {activeTab === 'dashboard' ? (
          <View style={styles.dashboardContainer}>
            <View style={styles.card}>
              <Text style={styles.cardHeader}>User Profile</Text>
              <Text style={styles.profileText}>
                <Text style={styles.boldText}>Name:</Text>{' '}
                {profile?.full_name || session.user.email?.split('@')[0]}
              </Text>
              <Text style={styles.profileText}>
                <Text style={styles.boldText}>Email:</Text> {session.user.email}
              </Text>
              <Text style={styles.profileText}>
                <Text style={styles.boldText}>Role:</Text>{' '}
                {profile?.role === 'admin' ? 'Administrator' : 'Medical Resident'}
              </Text>

              {/* Supporter Badge */}
              <View style={styles.badgeRow}>
                <Text style={styles.boldText}>Account Tier:</Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        profile?.supporter_tier && profile.supporter_tier !== 'none'
                          ? '#E2F0D9'
                          : '#F1F5F9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color:
                          profile?.supporter_tier && profile.supporter_tier !== 'none'
                            ? '#385723'
                            : '#64748B',
                      },
                    ]}
                  >
                    {profile?.supporter_tier && profile.supporter_tier !== 'none'
                      ? `${profile.supporter_tier.toUpperCase()} SUPPORTER`
                      : 'FREE TIER'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.card, styles.infoCard]}>
              <Text style={styles.infoCardTitle}>Data Sync Status</Text>
              <Text style={styles.infoCardBody}>
                Connected to the unified cloud database. Your case logs and board prep configurations are fully synced with the web app at anesthesiapp.my.id.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.calculatorContainer}>
            {/* Patient Weight Card */}
            <View style={styles.card}>
              <View style={styles.weightHeader}>
                <Text style={styles.cardLabel}>Patient Weight</Text>
                <Text style={styles.weightDisplay}>
                  {weight} <Text style={{ fontSize: 16 }}>kg</Text>
                </Text>
              </View>

              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={1}
                maximumValue={150}
                step={1}
                value={weight}
                onValueChange={setWeight}
                minimumTrackTintColor="#BE123C"
                maximumTrackTintColor="#CBD5E1"
                thumbTintColor="#BE123C"
              />

              {/* Presets */}
              <View style={styles.presetsRow}>
                <Text style={styles.presetGroupLabel}>Peds:</Text>
                <View style={styles.presetButtons}>
                  {[5, 15, 25].map((w) => (
                    <TouchableOpacity
                      key={w}
                      onPress={() => handleWeightPreset(w)}
                      style={[styles.presetBtn, weight === w && styles.presetBtnActive]}
                    >
                      <Text style={[styles.presetBtnText, weight === w && styles.presetBtnTextActive]}>
                        {w}k
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.presetGroupLabel, { marginLeft: 10 }]}>Adult:</Text>
                <View style={styles.presetButtons}>
                  {[50, 70, 90].map((w) => (
                    <TouchableOpacity
                      key={w}
                      onPress={() => handleWeightPreset(w)}
                      style={[styles.presetBtn, weight === w && styles.presetBtnActive]}
                    >
                      <Text style={[styles.presetBtnText, weight === w && styles.presetBtnTextActive]}>
                        {w}k
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {isPediatric && (
                <View style={styles.pediatricAlert}>
                  <Text style={styles.pediatricAlertText}>
                    ⚠️ Pediatric Weight active. Double-check airway size guidelines (ETT/LMA).
                  </Text>
                </View>
              )}
            </View>

            {/* Selector tabs for bolus/infusion */}
            <View style={styles.calcTabs}>
              <TouchableOpacity
                onPress={() => setActiveCalcTab('bolus')}
                style={[styles.calcTab, activeCalcTab === 'bolus' && styles.calcTabActive]}
              >
                <Text style={[styles.calcTabText, activeCalcTab === 'bolus' && styles.calcTabTextActive]}>
                  Bolus Dose
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveCalcTab('infusion')}
                style={[styles.calcTab, activeCalcTab === 'infusion' && styles.calcTabActive]}
              >
                <Text style={[styles.calcTabText, activeCalcTab === 'infusion' && styles.calcTabTextActive]}>
                  Infusion Pump
                </Text>
              </TouchableOpacity>
            </View>

            {/* Calculator Tab Body */}
            {activeCalcTab === 'bolus' ? (
              <View style={styles.calcBody}>
                {/* Drug select grid */}
                <Text style={styles.cardLabel}>Induction Agent</Text>
                <View style={styles.drugGrid}>
                  {BOLUS_DRUGS.map((d, idx) => (
                    <TouchableOpacity
                      key={d.name}
                      onPress={() => handleBolusDrugChange(idx)}
                      style={[styles.drugBtn, selectedBolusIdx === idx && styles.drugBtnActive]}
                    >
                      <Text style={[styles.drugBtnText, selectedBolusIdx === idx && styles.drugBtnTextActive]}>
                        {d.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Target Dose Range */}
                <View style={[styles.card, { marginTop: 15 }]}>
                  <View style={styles.weightHeader}>
                    <Text style={styles.cardLabel}>Target Dose</Text>
                    <Text style={styles.weightDisplay}>
                      {customBolusDose.toFixed(2)}{' '}
                      <Text style={{ fontSize: 14 }}>{selectedBolus.unit.split('/')[0]}/kg</Text>
                    </Text>
                  </View>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={selectedBolus.minDose}
                    maximumValue={selectedBolus.maxDose}
                    step={0.05}
                    value={customBolusDose}
                    onValueChange={setCustomBolusDose}
                    minimumTrackTintColor="#BE123C"
                    maximumTrackTintColor="#CBD5E1"
                    thumbTintColor="#BE123C"
                  />
                </View>

                {/* Output Cards */}
                <View style={styles.outputsRow}>
                  <View style={styles.outputCard}>
                    <Text style={styles.outputLabel}>Calculated Dose</Text>
                    <Text style={styles.outputValue}>{bolusResults.totalDoseFormatted}</Text>
                  </View>
                  <View style={[styles.outputCard, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={styles.outputLabel}>
                      Draw Volume ({selectedBolus.concentration} {selectedBolus.concentrationUnit})
                    </Text>
                    <Text style={[styles.outputValue, { color: '#059669' }]}>
                      {bolusResults.volume} ml
                    </Text>
                  </View>
                </View>

                {/* Clinical Tip */}
                <View style={[styles.card, styles.tipCard]}>
                  <Text style={styles.tipTitle}>{selectedBolus.class} Note</Text>
                  <Text style={styles.tipBody}>{selectedBolus.clinicalTip}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.calcBody}>
                {/* Drug select grid */}
                <Text style={styles.cardLabel}>Infusion Vasoactive</Text>
                <View style={styles.drugGrid}>
                  {INFUSION_DRUGS.map((d, idx) => (
                    <TouchableOpacity
                      key={d.name}
                      onPress={() => handleInfusionDrugChange(idx)}
                      style={[styles.drugBtn, selectedInfIdx === idx && styles.drugBtnActive]}
                    >
                      <Text style={[styles.drugBtnText, selectedInfIdx === idx && styles.drugBtnTextActive]}>
                        {d.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Syringe Configuration */}
                <View style={[styles.card, { marginTop: 15 }]}>
                  <Text style={styles.cardLabel}>Syringe Dilution Configuration</Text>
                  <View style={styles.inputRow}>
                    <View style={styles.inputFieldContainer}>
                      <Text style={styles.inputFieldLabel}>Amount ({selectedInf.syringeAmountUnit})</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(syringeAmount)}
                        onChangeText={(t) => setSyringeAmount(Number(t) || 0)}
                        style={styles.numericInput}
                      />
                    </View>
                    <View style={styles.inputFieldContainer}>
                      <Text style={styles.inputFieldLabel}>Total Volume (ml)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(syringeVolume)}
                        onChangeText={(t) => setSyringeVolume(Number(t) || 0)}
                        style={styles.numericInput}
                      />
                    </View>
                  </View>
                </View>

                {/* Dose Rate slider */}
                <View style={[styles.card, { marginTop: 15 }]}>
                  <View style={styles.weightHeader}>
                    <Text style={styles.cardLabel}>Target Dose Rate</Text>
                    <Text style={styles.weightDisplay}>
                      {customRate.toFixed(selectedInf.unit === 'mcg/kg/min' ? 2 : 1)}{' '}
                      <Text style={{ fontSize: 13 }}>{selectedInf.unit}</Text>
                    </Text>
                  </View>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={selectedInf.minRate}
                    maximumValue={selectedInf.maxRate}
                    step={selectedInf.unit === 'mcg/kg/min' ? 0.01 : 0.05}
                    value={customRate}
                    onValueChange={setCustomRate}
                    minimumTrackTintColor="#BE123C"
                    maximumTrackTintColor="#CBD5E1"
                    thumbTintColor="#BE123C"
                  />
                </View>

                {/* Output Card */}
                <View style={[styles.outputCard, { width: '100%', backgroundColor: '#ECFDF5', padding: 15 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={styles.outputLabel}>Infusion Flow Rate</Text>
                      <Text style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
                        Diluted Concentration: {infusionResults.concentration} mcg/ml
                      </Text>
                    </View>
                    <Text style={[styles.outputValue, { color: '#059669', fontSize: 24 }]}>
                      {infusionResults.flowRate} ml/hr
                    </Text>
                  </View>
                </View>

                {/* Calculation steps breakdown */}
                <View style={[styles.card, { marginTop: 15, backgroundColor: '#F8FAFC' }]}>
                  <Text style={[styles.cardLabel, { fontSize: 11 }]}>🔬 Mathematical Calculation Steps</Text>
                  <Text style={styles.monospaceText}>{infusionResults.stepBreakdown}</Text>
                </View>
              </View>
            )}

            {/* Disclaimer */}
            <Text style={styles.disclaimerText}>
              Disclaimer: All calculations are for simulation training only. Always verify clinical doses independently before administering to live patients.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* App bottom tabs */}
      <View style={styles.bottomTabs}>
        <TouchableOpacity
          onPress={() => setActiveTab('calculator')}
          style={[styles.bottomTab, activeTab === 'calculator' && styles.bottomTabActive]}
        >
          <Text style={[styles.bottomTabText, activeTab === 'calculator' && styles.bottomTabTextActive]}>
            🧮 Calculator
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('dashboard')}
          style={[styles.bottomTab, activeTab === 'dashboard' && styles.bottomTabActive]}
        >
          <Text style={[styles.bottomTabText, activeTab === 'dashboard' && styles.bottomTabTextActive]}>
            👤 Profile & Sync
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  authScroll: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  authHero: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
    marginBottom: 15,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  toggleText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#BE123C',
    fontWeight: 'bold',
    marginTop: 15,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    flex: 1,
  },
  signOutBtn: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  signOutBtnText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appContent: {
    padding: 15,
    paddingBottom: 80,
  },
  dashboardContainer: {
    flex: 1,
  },
  profileText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 10,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1E293B',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginBottom: 5,
  },
  infoCardBody: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  calculatorContainer: {
    flex: 1,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  weightDisplay: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  presetGroupLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    marginRight: 6,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  presetBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  presetBtnActive: {
    backgroundColor: '#FFE4E6',
    borderColor: '#FECDD3',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
  },
  presetBtnTextActive: {
    color: '#BE123C',
  },
  pediatricAlert: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  pediatricAlertText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  calcTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 15,
  },
  calcTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  calcTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  calcTabText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
  },
  calcTabTextActive: {
    color: '#1E293B',
  },
  calcBody: {
    width: '100%',
  },
  drugGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 15,
  },
  drugBtn: {
    flexGrow: 1,
    minWidth: '28%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  drugBtnActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  drugBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  drugBtnTextActive: {
    color: '#FFFFFF',
  },
  outputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
    marginBottom: 15,
  },
  outputCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  outputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  outputValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#BE123C',
    marginTop: 5,
  },
  tipCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    padding: 12,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  tipBody: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  inputFieldContainer: {
    flex: 1,
  },
  inputFieldLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 4,
  },
  numericInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  monospaceText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#475569',
    lineHeight: 15,
    marginTop: 10,
  },
  disclaimerText: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  bottomTabs: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomTab: {
    alignItems: 'center',
    paddingVertical: 10,
    flex: 1,
  },
  bottomTabActive: {
    backgroundColor: '#F8FAFC',
  },
  bottomTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
  },
  bottomTabTextActive: {
    color: '#BE123C',
  },
})
