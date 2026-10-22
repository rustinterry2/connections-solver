
import pyto_ui as ui
import photos

from itertools import combinations
from io import BytesIO
from PIL import ImageOps

from Vision import (
    VNRecognizeTextRequest,
    VNImageRequestHandler
)


class ConnectionsHelper:
    def __init__(self):
        # -----------------------------
        # Game state
        # -----------------------------
        self.words = []
        self.word_order = {}
        self.partitions = []
        self.display_groups = []
        self.selected_guess = None
        self.solved = False

        # -----------------------------
        # Main view
        # -----------------------------
        self.view = ui.View()
        self.view.title = "Connections Solver"
        self.view.background_color = ui.COLOR_SYSTEM_BACKGROUND
        self.view.size = (390, 760)

        self.word_fields = []

        self.build_ui()

    # =========================================================
    # Build the interface
    # =========================================================

    def build_ui(self):
        width = self.view.width

        # -----------------------------
        # Title
        # -----------------------------
        title = ui.Label()
        title.text = "Connections Solver"
        title.text_alignment = ui.TEXT_ALIGNMENT_CENTER
        title.size = (width - 24, 34)
        title.center = (width / 2, 28)
        title.flex = [ui.FLEXIBLE_WIDTH]

        self.view.add_subview(title)

        # -----------------------------
        # Instructions
        # -----------------------------
        subtitle = ui.Label()
        subtitle.text = "Enter the 8 remaining words"
        subtitle.text_alignment = ui.TEXT_ALIGNMENT_CENTER
        subtitle.size = (width - 24, 26)
        subtitle.center = (width / 2, 58)
        subtitle.flex = [ui.FLEXIBLE_WIDTH]

        self.view.add_subview(subtitle)

        # -----------------------------
        # Eight word fields
        # -----------------------------
        left_x = 12
        gap = 8

        field_width = (width - 24 - gap) / 2
        field_height = 38

        start_y = 82

        for i in range(8):

            field = ui.TextField(
                placeholder=f"Word {i + 1}"
            )

            field.size = (
                field_width,
                field_height
            )

            row = i // 2
            column = i % 2

            x = (
                left_x
                + column * (field_width + gap)
            )

            y = (
                start_y
                + row * 44
            )

            field.center = (
                x + field_width / 2,
                y + field_height / 2
            )

            # ---------------------------------
            # Keyboard Return key behavior
            # ---------------------------------
            if i < 7:
                field.return_key_type = (
                    ui.ReturnKeyType.NEXT
                )
            else:
                field.return_key_type = (
                    ui.ReturnKeyType.DONE
                )

            field.did_end_editing = (
                lambda sender, index=i:
                    self.advance_to_next_field(
                        index
                    )
            )

            self.view.add_subview(field)

            self.word_fields.append(field)

        # =====================================================
        # Generate / Upload buttons
        # =====================================================

        button_gap = 8
        action_button_width = (
            width - 24 - button_gap
        ) / 2

        # -----------------------------
        # Generate Options
        # -----------------------------
        self.generate_button = ui.Button(
            title="Generate Options"
        )

        self.generate_button.size = (
            action_button_width,
            44
        )

        self.generate_button.center = (
            12 + action_button_width / 2,
            282
        )

        self.generate_button.action = (
            self.generate_options
        )

        self.view.add_subview(
            self.generate_button
        )

        # -----------------------------
        # Upload Words
        # -----------------------------
        self.upload_button = ui.Button(
            title="Upload Words"
        )

        self.upload_button.size = (
            action_button_width,
            44
        )

        self.upload_button.center = (
            12
            + action_button_width
            + button_gap
            + action_button_width / 2,
            282
        )

        self.upload_button.action = (
            self.upload_words
        )

        self.view.add_subview(
            self.upload_button
        )

        # -----------------------------
        # Selected guess
        # -----------------------------
        self.selected_label = ui.Label()

        self.selected_label.text = (
            "Tap a guess"
        )

        self.selected_label.text_alignment = (
            ui.TEXT_ALIGNMENT_CENTER
        )

        self.selected_label.size = (
            width - 24,
            32
        )

        self.selected_label.center = (
            width / 2,
            322
        )

        self.selected_label.flex = [
            ui.FLEXIBLE_WIDTH
        ]

        self.view.add_subview(
            self.selected_label
        )

        # -----------------------------
        # Result buttons
        # -----------------------------
        button_width = (
            width - 24 - 16
        ) / 3

        button_y = 362

        # CORRECT
        self.correct_button = ui.Button(
            title="Correct"
        )

        self.correct_button.size = (
            button_width,
            42
        )

        self.correct_button.center = (
            12 + button_width / 2,
            button_y
        )

        self.correct_button.action = (
            self.correct_tapped
        )

        self.view.add_subview(
            self.correct_button
        )

        # 1 AWAY
        self.one_away_button = ui.Button(
            title="1 Away"
        )

        self.one_away_button.size = (
            button_width,
            42
        )

        self.one_away_button.center = (
            12
            + button_width
            + 8
            + button_width / 2,
            button_y
        )

        self.one_away_button.action = (
            self.one_away_tapped
        )

        self.view.add_subview(
            self.one_away_button
        )

        # 2 AWAY
        self.two_away_button = ui.Button(
            title="2 Away"
        )

        self.two_away_button.size = (
            button_width,
            42
        )

        self.two_away_button.center = (
            12
            + 2 * (button_width + 8)
            + button_width / 2,
            button_y
        )

        self.two_away_button.action = (
            self.two_away_tapped
        )

        self.view.add_subview(
            self.two_away_button
        )

        # -----------------------------
        # Status
        # -----------------------------
        self.status_label = ui.Label()

        self.status_label.text = (
            "Enter eight words to begin."
        )

        self.status_label.text_alignment = (
            ui.TEXT_ALIGNMENT_CENTER
        )

        self.status_label.size = (
            width - 24,
            34
        )

        self.status_label.center = (
            width / 2,
            404
        )

        self.status_label.flex = [
            ui.FLEXIBLE_WIDTH
        ]

        self.view.add_subview(
            self.status_label
        )

        # -----------------------------
        # Guess list
        # -----------------------------
        self.table = ui.TableView()

        self.table.size = (
            width - 24,
            330
        )

        self.table.center = (
            width / 2,
            588
        )

        self.table.flex = [
            ui.FLEXIBLE_WIDTH,
            ui.FLEXIBLE_HEIGHT
        ]

        self.view.add_subview(
            self.table
        )

        self.refresh_table()

    # =========================================================
    # Keyboard: move to next word
    # =========================================================

    def advance_to_next_field(self, index):

        # Fields 1 through 7
        if index < 7:

            self.word_fields[
                index + 1
            ].become_first_responder()

            return

        # Field 8:
        # generate automatically if complete
        all_words_entered = all(
            field.text.strip()
            for field in self.word_fields
        )

        if all_words_entered:
            self.generate_options(None)

    # =========================================================
    # Upload screenshot
    # =========================================================

    def upload_words(self, sender):

        self.status_label.text = (
            "Choose an image containing the 8 words."
        )

        try:

            image = photos.pick_photo()

        except Exception as error:

            self.status_label.text = (
                "Could not open Photos."
            )

            print(
                "Photo picker error:",
                error
            )

            return

        # User cancelled
        if image is None:

            self.status_label.text = (
                "Image selection cancelled."
            )

            return

        self.status_label.text = (
            "Reading words..."
        )

        try:

            words = self.read_words_from_image(
                image
            )

        except Exception as error:

            self.status_label.text = (
                "Could not read the image."
            )

            print(
                "OCR error:",
                error
            )

            return

        # ---------------------------------
        # Perfect result: exactly 8
        # ---------------------------------

        if len(words) == 8:

            for field, word in zip(
                self.word_fields,
                words
            ):

                field.text = word

            self.status_label.text = (
                "8 words found."
            )

            # Automatically create
            # the 35 solutions.
            self.generate_options(None)

            return

        # ---------------------------------
        # Fewer than 8 found
        # ---------------------------------

        if 0 < len(words) < 8:

            # Clear old entries first
            for field in self.word_fields:
                field.text = ""

            # Fill the words we did find
            for field, word in zip(
                self.word_fields,
                words
            ):

                field.text = word

            self.status_label.text = (
                f"Found only {len(words)} words. "
                "Please correct the entries."
            )

            return

        # ---------------------------------
        # More than 8 found
        # ---------------------------------

        if len(words) > 8:

            self.status_label.text = (
                f"Found {len(words)} text items. "
                "Crop the image to the 8 tiles."
            )

            return

        # ---------------------------------
        # Nothing found
        # ---------------------------------

        self.status_label.text = (
            "No words were recognized."
        )

    # =========================================================
    # Apple Vision OCR
    # =========================================================

    def read_words_from_image(self, image):

        # ---------------------------------
        # Correct image orientation
        # ---------------------------------

        image = ImageOps.exif_transpose(
            image
        )

        # ---------------------------------
        # Convert PIL image to PNG bytes
        #
        # Rubicon automatically converts
        # Python bytes to NSData for Vision.
        # ---------------------------------

        buffer = BytesIO()

        image.save(
            buffer,
            format="PNG"
        )

        image_data = (
            buffer.getvalue()
        )

        buffer.close()

        # ---------------------------------
        # Create Vision text request
        # ---------------------------------

        request = (
            VNRecognizeTextRequest
            .alloc()
            .init()
        )

        # 0 = fast
        # 1 = accurate
        request.setRecognitionLevel_(1)

        # Connections contains unusual
        # words/names, so don't let
        # language correction "fix" them.
        request.setUsesLanguageCorrection_(
            False
        )

        request.setRecognitionLanguages_(
            ["en-US"]
        )

        # ---------------------------------
        # Analyze image
        # ---------------------------------

        handler = (
            VNImageRequestHandler
            .alloc()
            .initWithData_options_(
                image_data,
                {}
            )
        )

        success = (
            handler
            .performRequests_error_(
                [request],
                None
            )
        )

        if not success:

            raise RuntimeError(
                "Vision OCR request failed."
            )

        # ---------------------------------
        # Retrieve Vision results
        # ---------------------------------

        results_attr = request.results

        if callable(results_attr):
            observations = results_attr()
        else:
            observations = results_attr

        if observations is None:
            return []

        detected = []

        for observation in observations:

            candidates = (
                observation
                .topCandidates_(1)
            )

            if not candidates:
                continue

            candidate = candidates[0]

            # -----------------------------
            # Recognized text
            # -----------------------------

            text_attr = candidate.string

            if callable(text_attr):
                text = str(
                    text_attr()
                )
            else:
                text = str(
                    text_attr
                )

            # Collapse accidental whitespace
            text = " ".join(
                text.strip().split()
            )

            if not text:
                continue

            # -----------------------------
            # Confidence
            # -----------------------------

            confidence_attr = (
                candidate.confidence
            )

            if callable(confidence_attr):

                confidence = float(
                    confidence_attr()
                )

            else:

                confidence = float(
                    confidence_attr
                )

            # -----------------------------
            # Bounding box
            #
            # Vision coordinates:
            # x = left to right
            # y = bottom to top
            # -----------------------------

            box_attr = (
                observation.boundingBox
            )

            if callable(box_attr):
                box = box_attr()
            else:
                box = box_attr

            x = float(
                box.origin.x
            )

            y = float(
                box.origin.y
            )

            width = float(
                box.size.width
            )

            height = float(
                box.size.height
            )

            center_x = (
                x + width / 2
            )

            center_y = (
                y + height / 2
            )

            detected.append(
                {
                    "text": text,
                    "confidence": confidence,
                    "x": center_x,
                    "y": center_y,
                    "area": width * height
                }
            )

        # ---------------------------------
        # Sort into the visual grid
        # ---------------------------------

        return self.sort_detected_words(
            detected
        )

    # =========================================================
    # Sort OCR results:
    #
    #     1  2  3  4
    #     5  6  7  8
    #
    # =========================================================

    def sort_detected_words(
        self,
        detected
    ):

        if not detected:
            return []

        # ---------------------------------
        # Expected Connections screenshot:
        # exactly two rows of four.
        #
        # If exactly eight labels were
        # detected, explicitly create the
        # top and bottom rows.
        # ---------------------------------

        if len(detected) == 8:

            # Highest Vision Y coordinates
            # are visually closest to top.
            by_height = sorted(
                detected,
                key=lambda item:
                    item["y"],
                reverse=True
            )

            top_row = by_height[:4]
            bottom_row = by_height[4:]

            top_row = sorted(
                top_row,
                key=lambda item:
                    item["x"]
            )

            bottom_row = sorted(
                bottom_row,
                key=lambda item:
                    item["x"]
            )

            ordered = (
                top_row
                + bottom_row
            )

        else:

            # Fallback ordering.
            #
            # This is mainly useful when OCR
            # misses one or more tiles.
            ordered = sorted(
                detected,
                key=lambda item: (
                    -item["y"],
                    item["x"]
                )
            )

        return [
            item["text"].upper()
            for item in ordered
        ]

    # =========================================================
    # Generate all possible solutions
    # =========================================================

    def generate_options(self, sender):

        words = [
            field.text.strip().upper()
            for field in self.word_fields
        ]

        # Make sure all eight fields contain something
        if any(not word for word in words):

            self.status_label.text = (
                "Please enter all 8 words."
            )

            return

        # Make sure all eight are unique
        if len(
            set(
                word.casefold()
                for word in words
            )
        ) != 8:

            self.status_label.text = (
                "Each word must be different."
            )

            return

        self.words = words

        self.word_order = {
            word: i
            for i, word
            in enumerate(words)
        }

        universe = frozenset(
            words
        )

        first_word = words[0]

        self.partitions = []

        # -------------------------------------------------
        # There are 70 possible groups of four.
        #
        # Every four-word group has an opposite
        # four-word complement.
        #
        # Therefore there are only 35 unique
        # two-group partitions.
        #
        # We keep the first entered word in group_a
        # so each partition is stored only once.
        # -------------------------------------------------

        for combo in combinations(
            words,
            4
        ):

            group_a = frozenset(
                combo
            )

            if first_word not in group_a:
                continue

            group_b = (
                universe - group_a
            )

            self.partitions.append(
                (
                    group_a,
                    group_b
                )
            )

        self.selected_guess = None
        self.solved = False

        self.selected_label.text = (
            "Tap a guess"
        )

        self.refresh_table()

        self.status_label.text = (
            f"{len(self.partitions)} solutions"
        )

    # =========================================================
    # Sorting and formatting
    # =========================================================

    def group_sort_key(
        self,
        group
    ):

        return tuple(
            sorted(
                self.word_order[word]
                for word in group
            )
        )

    @staticmethod
    def sentence_case(word):

        return (
            word[:1].upper()
            + word[1:].lower()
        )

    def format_group(
        self,
        group
    ):

        ordered = sorted(
            group,
            key=lambda word:
                self.word_order[word]
        )

        return " • ".join(
            self.sentence_case(word)
            for word in ordered
        )

    # =========================================================
    # Rebuild options list
    # =========================================================

    def refresh_table(self):

        # -------------------------------------------------
        # Only group_a is displayed.
        #
        # group_b is its implied complement.
        # -------------------------------------------------

        self.display_groups = sorted(
            {
                group_a
                for group_a, group_b
                in self.partitions
            },
            key=self.group_sort_key
        )

        cells = []

        for group in self.display_groups:

            cell = ui.TableViewCell()

            cell.text_label.text = (
                self.format_group(
                    group
                )
            )

            cells.append(cell)

        section = ui.TableViewSection(
            "",
            cells
        )

        def selected(
            section,
            index
        ):

            self.select_guess(
                index
            )

        section.did_select_cell = (
            selected
        )
        self.table.sections = [
            section
        ]

    # =========================================================
    # User selected a guess
    # =========================================================

    def select_guess(
        self,
        index
    ):

        if (
            index < 0
            or index
            >= len(
                self.display_groups
            )
        ):
            return

        self.selected_guess = (
            self.display_groups[
                index
            ]
        )

        self.selected_label.text = (
            self.format_group(
                self.selected_guess
            )
        )

    # =========================================================
    # Relationship between guess
    # and possible solution
    # =========================================================

    @staticmethod
    def relationship(
        partition,
        guess
    ):

        group_a, group_b = (
            partition
        )

        overlap = len(
            group_a & guess
        )

        # Correct
        if overlap in (0, 4):
            return 0

        # 1 Away
        if overlap in (1, 3):
            return 1

        # 2 Away
        return 2

    # =========================================================
    # Result buttons
    # =========================================================

    def correct_tapped(
        self,
        sender
    ):

        self.apply_feedback(0)

    def one_away_tapped(
        self,
        sender
    ):

        self.apply_feedback(1)

    def two_away_tapped(
        self,
        sender
    ):

        self.apply_feedback(2)

    # =========================================================
    # Apply feedback
    # =========================================================

    def apply_feedback(
        self,
        result
    ):

        if not self.partitions:

            self.status_label.text = (
                "Generate the options first."
            )

            return

        if self.selected_guess is None:

            self.status_label.text = (
                "Tap a guess first."
            )

            return

        if self.solved:

            self.status_label.text = (
                "Already solved. "
                "Generate to restart."
            )

            return

        guess = (
            self.selected_guess
        )

        remaining = [

            partition

            for partition
            in self.partitions

            if self.relationship(
                partition,
                guess
            ) == result

        ]

        # ---------------------------------
        # Contradiction
        # ---------------------------------

        if not remaining:

            self.status_label.text = (
                "No solutions fit "
                "that feedback."
            )

            return

        self.partitions = remaining

        # =================================
        # Correct
        # =================================

        if result == 0:

            self.solved = True

            group_a, group_b = (
                self.partitions[0]
            )

            if guess == group_a:
                other_group = group_b
            else:
                other_group = group_a

            self.refresh_table()

            self.status_label.text = (
                "Correct! Other group: "
                + self.format_group(
                    other_group
                )
            )

            return

        # =================================
        # 1 Away / 2 Away
        # =================================

        self.selected_guess = None

        self.selected_label.text = (
            "Tap your next guess"
        )

        self.refresh_table()

        if result == 1:
            label = "1 Away"
        else:
            label = "2 Away"

        self.status_label.text = (
            f"{label}: "
            f"{len(self.partitions)} solutions"
        )

    # =========================================================
    # Show app
    # =========================================================

    def show(self):

        ui.show_view(
            self.view,
            ui.PRESENTATION_MODE_SHEET
        )


# =============================================================
# Start
# =============================================================

app = ConnectionsHelper()
app.show()