import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { height, width } = Dimensions.get('window');

const C = {
    bg: '#473C33',
    header: '#ABC270',
    accent: '#ABC270',
    accentDim: 'rgba(171,194,112,0.14)',
    accentBorder: 'rgba(171,194,112,0.3)',
    cardBg: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.1)',
    textPrimary: '#f7e5c5',
    textMuted: '#c8a96e',
    textDim: '#a0896e',
    textDark: '#333',
    barEmpty: 'rgba(255,255,255,0.06)',
    inputBg: 'rgba(255,255,255,0.06)',
    inputBorder: 'rgba(255,255,255,0.1)',
    white10: 'rgba(255,255,255,0.1)',
    white30: 'rgba(255,255,255,0.3)',
};

export default StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },

    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: C.header, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: C.textDark },

    toast: { position: 'absolute', top: 118, alignSelf: 'center', zIndex: 99, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accentBorder, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
    toastDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
    toastText: { fontSize: 13, fontWeight: '500', color: C.accent },

    scroll: { paddingHorizontal: 5, paddingTop: 20, paddingBottom: 48, gap: 12, alignItems: 'center' },

    hintCard: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '95%', backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accentBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
    hintText: { fontSize: 13, color: C.accent, fontWeight: '500' },

    card: { width: '95%', backgroundColor: C.cardBg, borderRadius: 25, padding: 20, borderWidth: 1, borderColor: C.cardBorder },
    cardLabel: { fontSize: 11, fontWeight: '700', color: C.white30, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    chartTitle: { color: C.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 },

    goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    goalVal: { fontSize: 12, color: C.textDim },
    goalValBold: { color: C.textPrimary, fontWeight: '600' },
    progressTrack: { height: 7, backgroundColor: C.white10, borderRadius: 99, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: 99 },
    goalStatus: { fontSize: 12, color: C.textMuted, textAlign: 'right' },

    inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    input: { flex: 1, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.textPrimary },
    unitPill: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accentBorder, borderRadius: 12, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
    unitText: { fontSize: 13, color: C.accent, fontWeight: '700' },

    chartRow: { flexDirection: 'row', gap: 6, height: 140, alignItems: 'flex-end' },
    barCol: { flex: 1, alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' },
    barWeight: { fontSize: 9, color: C.textMuted, fontWeight: '700', height: 13, textAlign: 'center' },
    barTrack: { width: '100%', flex: 1, backgroundColor: C.barEmpty, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
    barTrackToday: { borderWidth: 1, borderColor: C.accentBorder, borderStyle: 'dashed' },
    barFill: { width: '100%', backgroundColor: C.accent, borderRadius: 6, opacity: 0.85 },
    barMood: { fontSize: 13, height: 18, textAlign: 'center' },
    barDay: { fontSize: 10, color: C.white30 },
    barDayToday: { color: C.accent, fontWeight: '700' },

    moodRow: { flexDirection: 'row', gap: 8 },
    moodBtn: { flex: 1, backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.white10, borderRadius: 14, paddingVertical: 10, alignItems: 'center', gap: 4 },
    moodBtnActive: { backgroundColor: C.accentDim, borderColor: 'rgba(171,194,112,0.5)' },
    moodLbl: { fontSize: 9, color: C.white30, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
    moodLblActive: { color: C.accent },

    saveBtn: { width: '95%', backgroundColor: C.header, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.45 },
    saveBtnText: { fontSize: 16, fontWeight: 'bold', color: C.textDark, letterSpacing: -0.2 },

}
);
