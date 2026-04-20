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

  // Challenge Feed
  feedSection: { marginTop: 30 },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  feedShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2ECC71',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  feedShareBtnText: { color: '#000', fontSize: 13, fontWeight: 'bold' },
  feedEmpty: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  feedCard: {
    backgroundColor: '#1c2e24',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  feedAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2C2C2C' },
  feedUsername: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  feedTimestamp: { color: '#888', fontSize: 12 },
  feedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#0a1812',
  },
  feedCaption: { color: '#DDDDDD', fontSize: 14, lineHeight: 20 },
  feedFooter: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
  },
  feedActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedActionCount: { color: '#888', fontSize: 13 },

  // Comments
  commentSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
  },
  noCommentText: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C2C2C',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#0a1812',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  commentUsername: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  commentText: { color: '#DDDDDD', fontSize: 13, lineHeight: 18, marginTop: 2 },

  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#0a1812',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  sendButton: {
    backgroundColor: '#2ECC71',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2C2C2C',
  },
});
