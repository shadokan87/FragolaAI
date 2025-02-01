<script lang="ts">

</script>
<div>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
</div>
<style lang="scss">
.dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
  border: 2px solid var(--vscode-progressBar-background);
  display: inline-block;
  margin-left: 0.25rem;
  margin-right: 0.25rem;
  animation: dotFill 1.4s infinite ease-in-out;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

@keyframes dotFill {
  0% {
    background-color: transparent;
  }
  40% {
    background-color: var(--vscode-progressBar-background);
  }
  80%, 100% {
    background-color: transparent;
  }
}
</style>