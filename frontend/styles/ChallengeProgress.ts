import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  centered: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#1E1E1E'
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },

  // Card section
  card: {
    backgroundColor: '#1c2e24',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2C2C2C'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between'
  },
  cardTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  cardSubtitle: { color: '#999999', fontSize: 14, marginTop: 4 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B3124',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  statusBadgeText: { color: '#2ECC71', fontSize: 12, fontWeight: 'bold' },

  // General Progress Section
  sectionLabel: { color: '#999999', fontSize: 12, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressText: { color: '#FFFFFF', fontSize: 14 },
  progressPercent: { color: '#2ECC71', fontSize: 16, fontWeight: 'bold' },
  barContainer: { height: 8, backgroundColor: '#2C2C2C', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#2ECC71' },

  // Today's Status Section
  todayStatusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20
  },
  todayValues: { flex: 1 },
  todayMainValue: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  todayGoalValue: { color: '#999999', fontSize: 18 },
  todayRemaining: { color: '#999999', fontSize: 14, marginTop: 4 },

  circularContainer: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },

  // Day History Grid
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10
  },
  historyDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  dotSuccess: { backgroundColor: '#2ECC71', borderColor: '#2ECC71' },
  dotFail: { backgroundColor: 'transparent', borderColor: '#444444' },
  dotToday: { backgroundColor: '#3498DB', borderColor: '#3498DB' },
  dotUpcoming: { backgroundColor: 'transparent', borderColor: '#222222' },

  historyLegend: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 15
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#999999', fontSize: 12 },

  rewardButton: {
    backgroundColor: '#2ECC71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20
  },
  rewardButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
});
