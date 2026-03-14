import { StyleSheet } from 'react-native';

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
  content: { padding: 20 },
  label: { color: '#c8a96e', fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  input: {
    backgroundColor: '#14281d',
    color: '#f7e5c5',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a3d33'
  },
  inputDisabled: {
    backgroundColor: '#0d1a14',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1d3528'
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2a3d33',
    backgroundColor: '#14281d'
  },
  typeButtonActive: { backgroundColor: '#47dd7caf', borderColor: '#47dd7caf' },
  typeButtonText: { color: '#a0896e', fontWeight: 'bold' },
  typeButtonTextActive: { color: '#000' },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14281d',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#c8a96e'
  },
  inviteButtonText: { color: '#f7e5c5', fontSize: 16 },
  createButton: {
    backgroundColor: '#c8a96e',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  createButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});
