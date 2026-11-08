interface ProgressBarProps {
    progress: number;
    label?: string;
    showPercentage?: boolean;
}

export default function ProgressBar({
                                        progress,
                                        label = "Fortschritt",
                                        showPercentage = true
                                    }: ProgressBarProps) {
    const safeProgress = Math.min(
        100,
        Math.max(0, progress)
    );

    return (
        <div className="progress-container">
            <div className="progress-header">
                <span>{label}</span>

                {showPercentage && (
                    <strong>{Math.round(safeProgress)}%</strong>
                )}
            </div>

            <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={safeProgress}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className="progress-fill"
                    style={{ width: `${safeProgress}%` }}
                />
            </div>
        </div>
    );
}