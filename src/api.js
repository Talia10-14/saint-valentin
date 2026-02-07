/**
 * Mock API Client for L'Archéologie du Sentiment
 * Following the GraphQL spec defined in backend/api_spec.md
 */

const MOCK_MEMORIES = [
    {
        id: "m1",
        name: "Premier Rire",
        emotionType: "Joy",
        storySnippet: "Un fragment de temps suspendu, où le monde s'est arrêté.",
        fullStory: "Un fragment de temps suspendu, où le monde s'est arrêté pour écouter votre harmonie. Ce doudou en garde la chaleur et l'éclat de cet instant unique.",
        position: { x: -2, y: 1, z: -5 },
        scale: 1.2,
        color: 0xffffff,
    },
    {
        id: "m2",
        name: "Douce Nuit",
        emotionType: "Tenderness",
        storySnippet: "Le calme absolu d'une nuit d'été étoilée.",
        fullStory: "Le calme absolu d'une nuit d'été étoilée, où chaque souffle était une promesse. Cette peluche capture la sérénité de vos rêves partagés.",
        position: { x: 3, y: 2, z: -8 },
        scale: 1,
        color: 0xffffff,
    },
    {
        id: "m3",
        name: "Lueur d'Espoir",
        emotionType: "Glow",
        storySnippet: "Un petit pas pour vous, un grand saut pour votre cœur.",
        fullStory: "Un petit pas pour vous, un grand saut pour votre cœur. Ce souvenir brille de la lumière que vous avez trouvée ensemble dans l'obscurité.",
        position: { x: 0, y: -1, z: -12 },
        scale: 1.5,
        color: 0xffffff,
    },
    {
        id: "m4",
        name: "Étreinte Magique",
        emotionType: "Hug",
        storySnippet: "Le réconfort d'un bras qui entoure et d'un cœur qui bat.",
        fullStory: "Le réconfort d'un bras qui entoure et d'un cœur qui bat à l'unisson. Cette peluche contient la chaleur de chaque étreinte partagée.",
        position: { x: -4, y: 2, z: -15 },
        scale: 1.1,
        color: 0xffffff,
    },
    {
        id: "m5",
        name: "Promesse d'Aube",
        emotionType: "Hope",
        storySnippet: "Le premier rayon de soleil après une longue attente.",
        fullStory: "Le premier rayon de soleil après une longue attente, illuminant le futur. Ce doudou est le gardien de vos plus belles promesses.",
        position: { x: 5, y: -2, z: -20 },
        scale: 1.3,
        color: 0xffffff,
    }
];

export const listMemories = async () => {
    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_MEMORIES), 500);
    });
};

export const getMemoryDetails = async (id) => {
    return new Promise((resolve) => {
        const memory = MOCK_MEMORIES.find(m => m.id === id);
        setTimeout(() => resolve(memory), 300);
    });
};

export const initiateCapture = async (id, config) => {
    console.log(`Initiating capture for memory ${id}`, config);
    return new Promise((resolve) => {
        setTimeout(() => resolve({
            orderSid: "ORD-" + Math.random().toString(36).substr(2, 9),
            stripeCheckoutUrl: "https://checkout.stripe.com/mock-session",
            status: "Initiated"
        }), 1000);
    });
};
