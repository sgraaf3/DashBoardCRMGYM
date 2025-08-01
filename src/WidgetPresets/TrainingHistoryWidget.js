import { ref, onMounted } from 'vue';

export default {
    template: `
    <div class="training-history-widget">
      <h2>Training History</h2>
      <div class="scrollable-list" ref="scrollableList">
        <div v-for="index in visibleRange" :key="index" class="list-item">
          Item #{{ index }} - Some content here
        </div>
      </div>
    </div>
  `,
    setup() {
        const scrollableList = ref(null);
        const itemCount = 1000; // Total number of items
        const visibleThreshold = 50; // Number of items to render initially and add on scroll
        const visibleRange = ref([...Array(Math.min(itemCount, visibleThreshold)).keys()].map(i => i + 1));

        const handleScroll = () => {
            if (scrollableList.value) {
                const element = scrollableList.value;
                if (element.scrollTop + element.clientHeight >= element.scrollHeight - 50) {
                    const currentMax = visibleRange.value.length;
                    const newMax = Math.min(itemCount, currentMax + visibleThreshold);
                    visibleRange.value = [...Array(newMax).keys()].map(i => i + 1);
                }
            }
        };

        onMounted(() => {
            scrollableList.value.addEventListener('scroll', handleScroll);
        });
        return { scrollableList, visibleRange };
    }
};