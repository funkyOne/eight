(ns foo.core
  (:require [reagent.core :as r]
            [reagent.dom :as rdom]))

;; STATE

(def plan {:name "Plan 1"
           :exercises [{:name "Blinking (2 minutes)" :duration 3 :rest 3 :repetitions 10}
                       {:name "Head Movement clockwise" :duration 15 :repetitions 1}
                       {:name "Head Movement counterclockwise" :duration 15 :repetitions 1}
                       {:name "Head Movement side to side" :duration 15 :repetitions 1}
                       {:name "Head Movement up and down" :duration 15 :repetitions 1}]})

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

(defn stop-timer [] (js/clearInterval @timer-handle)) 

(defn stop []
  (stop-timer)
  (reset! current-time 0)
  (reset! state nil))

(defn get-current [] (:exercise @state))

(defn tick [] (swap! current-time inc))

(defn reset-timer []
  (stop-timer)
  (reset! current-time 0)
  (reset! timer-handle (js/setInterval tick 1000)))

(defn select-exercise [i]  
  (let [exercise ((:exercises plan) i)
        timeline (gen-exercise-segments exercise)
        duration (:end-time (last timeline))]
    (reset! state {:index i  :exercise exercise :timeline timeline :duration duration :current 0}))  
  (reset-timer))

(add-watch current-time :counter-observer
           (fn [_ _ _ new-time]
             (let [segment-i (:current @state)
                   segment  (nth (:timeline @state) segment-i)]
               (cond
                 (< new-time (:end-time segment)) nil ;;current segment is not finished
                 (< new-time (:duration @state)) (swap! state (fn [state] (update state :current inc)))
                 :else (let [next-i (inc (:index @state))]
                         (if (< next-i (count (:exercises plan)))
                           (select-exercise next-i)
                           (stop-timer)))))))

;; COMPONENTS
(defn button-stop []
  [:input {:type "button"
           :value "STOP"
           :on-click (fn [_event] (stop))}])

(defn button-start []
  [:input {:type "button"
           :value "START"
           :on-click (fn [_event] (select-exercise 0))}])

(defn segment-view [segment] [:span (if (= "e" (:type segment)) "🟢" "⚪")])

(defn exercise-view [exercise timeline current]
  [:div.exercise
   [:span (inc @current-time)]
   [:div
    [:span "duration: "]    
    [:span (:duration exercise)]]
   [:div
    [:span "segment: "]
    [:span current]]
   [:span "exercise: "]
   [:span (:name exercise)]   
   (map segment-view timeline)]
  )


(defn container []
  [:div
   [button-stop]
   [button-start]
   (if-not (nil? @state) (exercise-view (:exercise @state) (:timeline @state) (:current @state)) [:div "no exercise"])
  ])

;; RENDER
(defn root []
  (.getElementById js/document "app"))

(defn ^:export init []
  (rdom/render [container] (root)))