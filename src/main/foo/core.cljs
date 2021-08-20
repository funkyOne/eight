(ns foo.core
  (:require [reagent.core :as r]
            [reagent.dom :as rdom]))

;; STATE

(def plan {:name "Eye exercises"
           :exercises [{:name "Blink often" :duration 60 :repetitions 1}
                       {:name "Blinking slow" :duration 3 :rest 3 :repetitions 10}
                       {:name "Head Movement clockwise" :duration 15 :repetitions 1}
                       {:name "Head Movement counterclockwise" :duration 15 :repetitions 1}
                       {:name "Head Movement side to side" :duration 15 :repetitions 1}
                       {:name "Head Movement up and down" :duration 15 :repetitions 1}
                       {:name "Eye Movement - left and right" :duration 30 :repetitions 1}
                       {:name "Eye Movement - up and down" :duration 30 :repetitions 1}
                       {:name "Eye Movement - 8" :duration 30 :repetitions 1}
                       {:name "Eye Movement - random direction" :duration 30 :repetitions 1}
                       {:name "Squeezing Eyes Shut" :duration 3 :rest 3 :repetitions 10}
                       {:name "Eyes Shut Movements" :duration 60 :repetitions 1}
                       {:name "Change Focus" :duration 10 :rest 10 :repetitions 3} ;; here rest is de-focus, this makes it sound ok, maybe we should replace rest with mode generic term, something like "alternate"
                       {:name "Temple Massage" :duration 10 :rest 5 :repetitions 4}
                       {:name "Eyes Palming" :duration 60 :repetitions 1}]})

(defn preload-sound [path]
  (let [el (.createElement js/document "audio")]
    (.setAttribute el "src" path)
    (.setAttribute el "preload" "true")
    el))

(defonce sound-up (preload-sound "sounds/220202__gameaudio__teleport-casual.wav"))

(defonce sound-down (preload-sound "sounds/220174__gameaudio__spacey-loose.wav"))

(defonce state (r/atom nil))

(defonce timer-handle (atom nil))

(defonce current-time (r/atom 0))

;; LOGIC
(defn gengen [exercise n timeline start-time]
  (if (pos? n)
    (let [duration (:duration exercise)
          rest-start-time (+ start-time duration)
          rest-duration (:rest exercise)
          next-time (+ rest-start-time rest-duration)
          new-timeline (conj timeline {:type "e" :start-time start-time :duration duration :end-time rest-start-time} {:type "r" :start-time rest-start-time :duration rest-duration :end-time next-time})]
      (recur exercise (dec n) new-timeline next-time))
    timeline))

(defn gen-exercise-segments [exercise] (butlast (gengen exercise (:repetitions exercise) [] 0)))

(defn stop-timer []
  (js/clearInterval @timer-handle)
  (reset! timer-handle nil))

(defn stop []
  (stop-timer)
  (reset! current-time 0)
  (reset! state nil))

(defn tick [] (swap! current-time inc))

(defn start-timer []
  (reset! timer-handle (js/setInterval tick 1000)))

(defn reset-timer []
  (stop-timer)
  (reset! current-time 0)
  (start-timer))

(defn speak [text]
  (let [uter (js/SpeechSynthesisUtterance. text)]
    (set! (.. uter -voice) (aget (.getVoices (.-speechSynthesis js/window)) 2))
    (.speak (.-speechSynthesis js/window) uter)))

(defn on-finish []
  (speak (rand-nth ["good job!" "nice one, pal!" "well done, buddy!" "you are the best" "all done!" "you've made it"]))
  (stop))

(defn select-exercise [i]
  (let [exercise ((:exercises plan) i)
        timeline (gen-exercise-segments exercise)
        duration (:end-time (last timeline))]
    (speak (:name exercise))
    (reset! state {:index i  :exercise exercise :timeline timeline :duration duration :current 0}))
  (reset-timer))

(defn next-segment []
  ((swap! state (fn [state] (update state :current inc)))))

(add-watch state :segment-switch-observer
           (fn [_ _ old-state new-state]
             (let [prev (:current old-state)
                   new (:current new-state)]
               (when (and (= (:index old-state) (:index new-state)) (not (= prev new))) ;;when changed segment inside exercise
                 (let [timeline     (:timeline @state)
                       prev-segment (nth timeline prev)]
                   (when (= (:type prev-segment) "e")
                     (.play sound-down))
                   (when (= (:type prev-segment) "r")
                     (.play sound-up)))))))


(add-watch current-time :counter-observer
           (fn [_ _ _ new-time]
             (let [segment-i (:current @state)
                   segment (nth (:timeline @state) segment-i)]
               (cond
                 (< new-time (:end-time segment)) nil ;;current segment is not finished, keeping on
                 (< new-time (:duration @state)) (next-segment) ;;segment finished, moving to next segment
                 :else (let [next-i (inc (:index @state))] ;;exercise finished
                         (if (< next-i (count (:exercises plan)));; are there more excercises?
                           (select-exercise next-i) ;;yes, moving to next
                           (on-finish))))))) ;;no more excercises, stopping

;; COMPONENTS
(defn button-stop []
  [:input {:type "button"
           :value "STOP"
           :on-click (fn [_event] (stop))}])

(defn button-pause []
  [:input {:type "button"
           :value "PAUSE"
           :on-click (fn [_event] (stop-timer))}])

(defn button-resume []
  [:input {:type "button"
           :value "RESUME"
           :on-click (fn [_event] (start-timer))}])

(defn button-start []
  [:input {:type "button"
           :value "START"
           :on-click (fn [_event] (select-exercise 0))}])

(defn button-next []
  [:input {:type "button"
           :value ">>"
           :on-click (fn [_event] (select-exercise (inc (:index @state))))}])

(defn segment-view [current index segment] ^{:key index}[:span {:class ["segment" (when (= index current) "active")]} (if (= "e" (:type segment)) "🟢" "⚪")])

(defn exercise-view [exercise timeline current]
  [:div.exercise
   [:span (inc @current-time)]
   [button-pause]
   [button-resume]
   [button-next]
   [:input {:type "button"
            :value "SPEAK "
            :on-click (fn [_event] (speak "test oleg"))}]
   [:div
    [:span "duration: "]
    [:span (:duration exercise)]]
   [:div
    [:span "segment: "]
    [:span current]]
   [:span "exercise: "]
   [:span (:name exercise)]
   (map-indexed (partial segment-view current) timeline)])


(defn container []
  [:div
   [button-stop]
   [button-start]
   (if-not (nil? @state) (exercise-view (:exercise @state) (:timeline @state) (:current @state)) [:div "no exercise"])])

;; RENDER
(defn root []
  (.getElementById js/document "app"))

(defn ^:export init []
  (rdom/render [container] (root)))