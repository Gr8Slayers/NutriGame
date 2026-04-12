import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#473C33',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#3a312a',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#f7e5c5',
    },
    backButton: {
        padding: 4,
    },
    placeholder: {
        width: 32,
    },

    // Profile Header
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    avatarLarge: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: '#c8a96e',
    },
    avatarLargePlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#5a4a3a',
        borderWidth: 3,
        borderColor: '#c8a96e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    username: {
        fontSize: 22,
        fontWeight: '700',
        color: '#f7e5c5',
        marginTop: 12,
        marginBottom: 4,
    },
    miniBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    miniBadge: {
        width: 18,
        height: 18,
        resizeMode: 'contain',
    },
    followButton: {
        marginTop: 8,
        paddingHorizontal: 28,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#c8a96e',
    },
    followButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2a221a',
    },
    unfollowButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#c8a96e',
    },
    unfollowButtonText: {
        color: '#c8a96e',
    },

    // Stats Row
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginHorizontal: 20,
        backgroundColor: '#3a312a',
        borderRadius: 14,
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#c8a96e',
    },
    statLabel: {
        fontSize: 11,
        color: '#a0896e',
        marginTop: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Streak Card
    streakCard: {
        marginHorizontal: 20,
        backgroundColor: '#3a312a',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
    },
    streakHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    streakTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f7e5c5',
        marginLeft: 8,
    },
    streakStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    streakStatItem: {
        alignItems: 'center',
    },
    streakStatValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#e87c3e',
    },
    streakStatLabel: {
        fontSize: 11,
        color: '#a0896e',
        marginTop: 2,
    },

    // Badges
    badgesSection: {
        marginHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f7e5c5',
        marginBottom: 12,
    },
    badgesScroll: {
        paddingRight: 20,
    },
    badgeItem: {
        alignItems: 'center',
        backgroundColor: '#3a312a',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginRight: 8,
        minWidth: 65,
    },
    badgeIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#4d3826',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    badgeName: {
        fontSize: 8,
        color: '#f7e5c5',
        fontWeight: '600',
        textAlign: 'center',
    },
    noBadgesText: {
        fontSize: 13,
        color: '#6b5440',
        fontStyle: 'italic',
    },

    // Posts Section
    postsSection: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    card: {
        backgroundColor: '#3a2b1e',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#4d3826',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 10,
    },

    userInfo: {
        flex: 1,
    },
    timestamp: {
        fontSize: 11,
        color: '#8a7060',
        marginTop: 1,
    },
    recipeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#7a4f28',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    recipeBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
    postImage: {
        width: '100%',
        height: 220,
        resizeMode: 'cover',
    },
    recipeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 4,
    },
    recipeTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f0d9b0',
        flex: 1,
        marginRight: 8,
    },
    calorieBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#3d2415',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#e87c3e44',
    },
    calorieText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#e87c3e',
    },
    caption: {
        fontSize: 13,
        color: '#c4a882',
        lineHeight: 19,
        paddingHorizontal: 14,
        paddingTop: 6,
        paddingBottom: 10,
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginHorizontal: 14,
        marginBottom: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#2f2015',
        borderWidth: 1,
        borderColor: '#c8a96e44',
    },
    expandButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#c8a96e',
    },
    recipeDetails: {
        marginHorizontal: 14,
        marginBottom: 14,
        backgroundColor: '#2a1e12',
        borderRadius: 12,
        padding: 14,
        gap: 6,
        borderWidth: 1,
        borderColor: '#3d2e20',
    },
    prepTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    prepTimeText: {
        fontSize: 12,
        color: '#a0896e',
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#c8a96e',
        marginTop: 8,
        marginBottom: 2,
    },
    sectionContent: {
        fontSize: 13,
        color: '#c4a882',
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#3d2e20',
        gap: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionCount: {
        fontSize: 13,
        color: '#a0896e',
        fontWeight: '600',
    },
    noPostsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noPostsText: {
        fontSize: 14,
        color: '#6b5440',
        marginTop: 8,
    },

    // Loading
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#3a312a',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#c8a96e44',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#4d3826',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f7e5c5',
    },
    closeButton: {
        padding: 4,
    },
    modalList: {
        paddingBottom: 10,
    },
    userListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#4d3826',
    },
    modalAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#c8a96e',
    },
    modalUsername: {
        fontSize: 16,
        color: '#f7e5c5',
        fontWeight: '600',
    },
    emptyModalText: {
        textAlign: 'center',
        color: '#a0896e',
        fontSize: 14,
        marginTop: 20,
        fontStyle: 'italic',
    },
});
