import { StyleSheet, Platform, StatusBar } from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2b2118',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },

    // ── Header ──────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#ABC270',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 10,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 32,
    },

    // ── Search Bar ────────────────────────────────────────────────────────
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3a2b1e',
        borderRadius: 14,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#4d3826',
        gap: 10,
    },
    searchIcon: {
        flexShrink: 0,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#f0d9b0',
    },

    loader: {
        marginTop: 12,
    },

    // ── List ─────────────────────────────────────────────────────────────
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 40,
        flexGrow: 1,
    },

    // ── User Card ─────────────────────────────────────────────────────────
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3a2b1e',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#4d3826',
        gap: 12,
    },
    avatarContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#c8a96e',
        flexShrink: 0,
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
    username: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#f0d9b0',
    },

    // ── Follow button ─────────────────────────────────────────────────────
    followButton: {
        paddingHorizontal: 18,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: '#ABC270',
        minWidth: 90,
        alignItems: 'center',
    },
    followButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#333',
    },
    followingButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#c8a96e',
    },
    followingButtonText: {
        color: '#c8a96e',
    },

    // ── Empty state ───────────────────────────────────────────────────────
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6b5440',
    },
    emptySubText: {
        fontSize: 13,
        color: '#5a4a3a',
        textAlign: 'center',
        paddingHorizontal: 32,
    },
});
