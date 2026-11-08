import type { LucideIcon } from "lucide-react";

interface StatusCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    color?: "blue" | "green" | "orange" | "purple";
}

export default function StatusCard({
                                       title,
                                       value,
                                       description,
                                       icon: Icon,
                                       color = "blue"
                                   }: StatusCardProps) {
    return (
        <div className="status-card">
            <div className={`status-card-icon ${color}`}>
                <Icon size={22} />
            </div>

            <div className="status-card-content">
                <span>{title}</span>
                <strong>{value}</strong>
                <small>{description}</small>
            </div>
        </div>
    );
}