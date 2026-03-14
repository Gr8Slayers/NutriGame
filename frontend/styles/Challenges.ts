import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1812' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#14281d'
  },
  headerTitle: { color: '#f7e5c5', fontSize: 20, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', backgroundColor: '#14281d', paddingVertical: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#c8a96e' },
  tabText: { color: '#a0896e', fontWeight: 'bold', fontSize: 16 },
  tabTextActive: { color: '#f7e5c5' },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14281d',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#2a3d33',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1c2e24', alignItems: 'center', justifyContent: 'center' },
  itemTitle: { color: '#f7e5c5', fontSize: 16, fontWeight: 'bold' },
  itemSubtitle: { color: '#a0896e', fontSize: 12, marginTop: 2 },
  progressBarBg: { height: 8, backgroundColor: '#0d1a14', borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#47dd7caf' },
  progressValue: { color: '#c8a96e', fontWeight: 'bold', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#c8a96e', alignItems: 'center', justifyContent: 'center' },
  declineBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2a1a1a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e57373' },
  emptyText: { color: '#a0896e', textAlign: 'center', marginTop: 50, fontSize: 16 }
});
