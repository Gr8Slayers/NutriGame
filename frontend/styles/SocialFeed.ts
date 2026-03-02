import { StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#473C33',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        backgroundColor: '#ABC270',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 10,
        zIndex: 10,
    },
    backButton: {
        padding: 8,
    },
    menuButton: {
        padding: 8,

    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 40,
    },

    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
        gap: 16,
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
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 10,
    },
    avatarContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#c8a96e',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        flex: 1,
        backgroundColor: '#4d3826',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 14,
        fontWeight: '700',
        color: '#f7e5c5',
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

    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b5440',
        marginTop: 8,
    },
    emptySubText: {
        fontSize: 13,
        color: '#5a4a3a',
    },

    // ── Comment Section ──────────────────────────────────────────────────────
    commentSection: {
        borderTopWidth: 1,
        borderTopColor: '#3d2e20',
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 14,
        gap: 10,
    },
    noCommentText: {
        fontSize: 12,
        color: '#6b5440',
        textAlign: 'center',
        paddingVertical: 6,
        fontStyle: 'italic',
    },
    commentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    commentAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    commentAvatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#4d3826',
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentBubble: {
        flex: 1,
        backgroundColor: '#2a1e12',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: '#3d2e20',
    },
    commentUsername: {
        fontSize: 12,
        fontWeight: '700',
        color: '#c8a96e',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 13,
        color: '#c4a882',
        lineHeight: 18,
    },
    commentInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#2a1e12',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        fontSize: 13,
        color: '#f0d9b0',
        borderWidth: 1,
        borderColor: '#4d3826',
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3d2e20',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#c8a96e44',
    },
    sendButtonDisabled: {
        opacity: 0.4,
    },

    post: {
        backgroundColor: '#3a2b1e',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
    },

    menuContainer: {
        alignSelf: 'center',
        backgroundColor: '#473C33',
        flexDirection: "row",
        justifyContent: "center",
        alignItems: 'flex-end', // Butonları alt hizada eşitlemek için
        width: width * 1,
        borderRadius: 25,
        paddingVertical: 5,
        zIndex: 10,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        marginBottom: 8,
        marginTop: 8,
    },
    newPostButton: {
        backgroundColor: '#fc8500',
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: "center",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
});